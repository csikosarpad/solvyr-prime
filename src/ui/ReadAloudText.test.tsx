import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAudioSettings } from "@/game/state/audioSettings";
import { useGameStore } from "@/game/state/gameStore";
import { useBriefingPreferences } from "@/game/state/briefingPreferences";
import { sectorById } from "@/game/data/sectors";
import { useLocaleStore } from "@/i18n";
import { cancelSpeech, speak } from "@/game/systems/speech";
import { CampaignMap } from "./CampaignMap";
import { SectorBriefing } from "./SectorBriefing";

vi.mock("./CampaignStarfieldCanvas", () => ({ CampaignStarfieldCanvas: () => null }));

class Utterance {
  onboundary?: (event: { name: string; charIndex: number }) => void;
  onend?: () => void;
  onerror?: () => void;
  constructor(public text: string) {}
}

const nativeSpeak = vi.fn<(utterance: Utterance) => void>();
const nativeCancel = vi.fn();
const currentUtterance = () => nativeSpeak.mock.calls.at(-1)![0];
const boundary = (utterance: Utterance, word: string, name = "word") => {
  act(() => utterance.onboundary?.({ name, charIndex: utterance.text.indexOf(word) }));
};

describe("synchronized read-aloud highlighting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("SpeechSynthesisUtterance", Utterance);
    vi.stubGlobal("speechSynthesis", {
      speak: nativeSpeak,
      cancel: nativeCancel,
      getVoices: () => [],
      speaking: true,
      pending: false,
    });
    useLocaleStore.getState().setLocale("hu");
    useGameStore.setState({ muted: false, sector: sectorById("forge-17"), matchMode: "campaign" });
    useAudioSettings.setState({
      channels: { music: true, voice: true, effects: true },
      volume: 0.4,
      channelVolumes: { music: 1, voice: 1, effects: 1 },
    });
    useBriefingPreferences.setState({ hiddenSectorIds: [], error: null });
  });

  afterEach(() => {
    cleanup();
    cancelSpeech();
    vi.unstubAllGlobals();
    useLocaleStore.getState().setLocale("hu");
  });

  it("keeps the full goal visible and highlights only boundary-reported words, including accented words", () => {
    const { container } = render(<CampaignMap />);
    const goal = screen.getByRole("region", { name: "A kampány célja" });
    const fullText = goal.querySelector("p")!.textContent;
    expect(nativeSpeak).not.toHaveBeenCalled();
    fireEvent.click(within(goal).getByRole("button", { name: "Felolvasás" }));
    expect(container.querySelector(".read-aloud-word")).toBeNull();
    const utterance = currentUtterance();
    boundary(utterance, "kampány");
    expect(container.querySelector("h2 .read-aloud-word")?.textContent).toBe("kampány");
    boundary(utterance, "Haladj");
    expect(container.querySelector("p .read-aloud-word")?.textContent).toBe("Haladj");
    expect(container.querySelectorAll(".read-aloud-word")).toHaveLength(1);
    expect(goal.querySelector("p")!.textContent).toBe(fullText);
    act(() => utterance.onend?.());
    expect(container.querySelector(".read-aloud-word")).toBeNull();
  });

  it("maps sector headings, briefing and protected-objective words to their displayed positions", () => {
    const { container } = render(<SectorBriefing />);
    fireEvent.click(screen.getByRole("button", { name: "Felolvasás" }));
    const utterance = currentUtterance();
    for (const word of ["FORGE-17", "Industrial", "Energiareaktor"]) {
      boundary(utterance, word);
      expect(container.querySelector(".read-aloud-word")?.textContent).toBe(word);
    }
    const briefing = container.querySelector("p")!.textContent!;
    const firstWord = briefing.match(/[\p{L}\p{N}]+/u)![0];
    boundary(utterance, firstWord);
    expect(container.querySelector("p .read-aloud-word")?.textContent).toBe(firstWord);
  });

  it("ignores sentence boundaries and clears on speech errors", () => {
    const { container } = render(<CampaignMap />);
    fireEvent.click(screen.getByRole("button", { name: "Felolvasás" }));
    const utterance = currentUtterance();
    boundary(utterance, "Haladj", "sentence");
    expect(container.querySelector(".read-aloud-word")).toBeNull();
    boundary(utterance, "Haladj");
    act(() => utterance.onerror?.());
    expect(container.querySelector(".read-aloud-word")).toBeNull();
    boundary(utterance, "szektorról");
    expect(container.querySelector(".read-aloud-word")).toBeNull();
  });

  it("clears immediately on cancellation and ignores late events from a replaced reading", () => {
    const { container } = render(<CampaignMap />);
    const button = screen.getByRole("button", { name: "Felolvasás" });
    fireEvent.click(button);
    const previous = currentUtterance();
    boundary(previous, "Haladj");
    fireEvent.click(button);
    expect(container.querySelector(".read-aloud-word")).toBeNull();
    expect(screen.getByRole("button", { name: "Felolvasás" })).toBeEnabled();
    fireEvent.click(button);
    boundary(previous, "Haladj");
    expect(container.querySelector(".read-aloud-word")).toBeNull();
    boundary(currentUtterance(), "Haladj");
    act(() => cancelSpeech());
    expect(container.querySelector(".read-aloud-word")).toBeNull();
  });

  it.each(["goal", "briefing"])(
    "can stop %s speech before any word event and restart from the beginning",
    (surface) => {
      render(surface === "goal" ? <CampaignMap /> : <SectorBriefing />);
      fireEvent.click(screen.getByRole("button", { name: "Felolvasás" }));
      const previous = currentUtterance();
      const stopButton = screen.getByRole("button", { name: "Leállítás" });
      expect(stopButton).toBeEnabled();
      fireEvent.click(stopButton);
      expect(nativeCancel).toHaveBeenCalledTimes(2);
      expect(nativeSpeak).toHaveBeenCalledOnce();
      fireEvent.click(screen.getByRole("button", { name: "Felolvasás" }));
      expect(currentUtterance().text).toBe(previous.text);
      expect(nativeSpeak).toHaveBeenCalledTimes(2);
      act(() => currentUtterance().onend?.());
      expect(screen.getByRole("button", { name: "Felolvasás" })).toBeEnabled();
    },
  );

  it("restores the read button on an external cancellation", () => {
    render(<CampaignMap />);
    fireEvent.click(screen.getByRole("button", { name: "Felolvasás" }));
    expect(screen.getByRole("button", { name: "Leállítás" })).toBeEnabled();
    act(() => cancelSpeech());
    expect(screen.getByRole("button", { name: "Felolvasás" })).toBeEnabled();
  });

  it.each(["language", "mute", "voice", "zero-volume"])(
    "stops and clears when %s changes without restarting",
    (change) => {
      const { container } = render(<CampaignMap />);
      fireEvent.click(screen.getByRole("button", { name: "Felolvasás" }));
      boundary(currentUtterance(), "Haladj");
      act(() => {
        if (change === "language") useLocaleStore.getState().setLocale("en");
        if (change === "mute") useGameStore.setState({ muted: true });
        if (change === "voice") useAudioSettings.setState({ channels: { music: true, effects: true, voice: false } });
        if (change === "zero-volume") useAudioSettings.setState({ volume: 0 });
      });
      expect(container.querySelector(".read-aloud-word")).toBeNull();
      expect(nativeCancel).toHaveBeenCalledTimes(2);
      expect(nativeSpeak).toHaveBeenCalledOnce();
    },
  );

  it("stops a briefing when acknowledged without persisting its reading", () => {
    render(<SectorBriefing />);
    fireEvent.click(screen.getByRole("button", { name: "Felolvasás" }));
    fireEvent.click(screen.getByRole("button", { name: "Értettem" }));
    expect(nativeCancel).toHaveBeenCalledTimes(2);
    expect(nativeSpeak).toHaveBeenCalledOnce();
  });

  it("does not interrupt unrelated combat speech on unmount after the manual reading ends", () => {
    const { unmount } = render(<CampaignMap />);
    fireEvent.click(screen.getByRole("button", { name: "Felolvasás" }));
    act(() => currentUtterance().onend?.());
    speak("Combat", "en");
    nativeCancel.mockClear();
    unmount();
    expect(nativeCancel).not.toHaveBeenCalled();
  });

  it("clears when the existing combat queue overflows and cancels the manual reading", () => {
    const { container } = render(<CampaignMap />);
    fireEvent.click(screen.getByRole("button", { name: "Felolvasás" }));
    boundary(currentUtterance(), "Haladj");
    act(() => {
      for (let i = 0; i < 3; i++) speak("Combat", "en");
    });
    expect(container.querySelector(".read-aloud-word")).toBeNull();
  });
});
