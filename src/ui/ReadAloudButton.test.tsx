import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAudioSettings } from "@/game/state/audioSettings";
import { useGameStore } from "@/game/state/gameStore";
import { useBriefingPreferences } from "@/game/state/briefingPreferences";
import { TRAINING_SECTOR, sectorById } from "@/game/data/sectors";
import { useLocaleStore } from "@/i18n";
import { speak, cancelSpeech, speechSupported } from "@/game/systems/speech";
import { ReadAloudButton } from "./ReadAloudButton";
import { SectorBriefing } from "./SectorBriefing";
import { CampaignMap } from "./CampaignMap";

vi.mock("@/game/systems/speech", () => ({
  speak: vi.fn(),
  cancelSpeech: vi.fn(),
  speechSupported: vi.fn(() => true),
}));
vi.mock("./CampaignStarfieldCanvas", () => ({ CampaignStarfieldCanvas: () => null }));

describe("explicit read-aloud controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(speechSupported).mockReturnValue(true);
    useLocaleStore.getState().setLocale("hu");
    useGameStore.setState({ muted: false, sector: TRAINING_SECTOR, matchMode: "skirmish" });
    useAudioSettings.setState({
      channels: { music: true, voice: true, effects: true },
      volume: 0.4,
      channelVolumes: { music: 1, voice: 1, effects: 1 },
    });
    useBriefingPreferences.setState({ hiddenSectorIds: [], error: null });
  });

  afterEach(() => {
    cleanup();
    useLocaleStore.getState().setLocale("hu");
  });

  it("never speaks on mount, text updates or language changes; speaks only on click", () => {
    const { rerender } = render(<ReadAloudButton text="Első szöveg" />);
    rerender(<ReadAloudButton text="Második szöveg" />);
    act(() => useLocaleStore.getState().setLocale("en"));
    expect(speak).not.toHaveBeenCalled();
    expect(cancelSpeech).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Read aloud" }));
    expect(cancelSpeech).toHaveBeenCalledOnce();
    expect(speak).toHaveBeenCalledWith("Második szöveg", "en", undefined, 0, 0.4, expect.any(Object));
  });

  it.each(["muted", "voice-disabled", "zero-volume", "zero-voice-volume", "unsupported"])(
    "does not speak when %s",
    (reason) => {
      if (reason === "muted") useGameStore.setState({ muted: true });
      if (reason === "voice-disabled")
        useAudioSettings.setState({ channels: { music: true, effects: true, voice: false } });
      if (reason === "zero-volume") useAudioSettings.setState({ volume: 0 });
      if (reason === "zero-voice-volume")
        useAudioSettings.setState({ channelVolumes: { music: 1, voice: 0, effects: 1 } });
      if (reason === "unsupported") vi.mocked(speechSupported).mockReturnValue(false);
      render(<ReadAloudButton text="Test" />);
      const button = screen.getByRole("button", { name: "Felolvasás" });
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("title");
      fireEvent.click(button);
      expect(speak).not.toHaveBeenCalled();
    },
  );

  it("reads the campaign goal only when its button is pressed", () => {
    render(<CampaignMap />);
    expect(speak).not.toHaveBeenCalled();
    const goal = screen.getByRole("region", { name: "A kampány célja" });
    fireEvent.click(within(goal).getByRole("button", { name: "Felolvasás" }));
    expect(speak).toHaveBeenCalledWith(
      expect.stringContaining("Haladj szektorról szektorra"),
      "hu",
      undefined,
      0,
      0.4,
      expect.any(Object),
    );
  });

  it.each(["skirmish", "campaign"] as const)("reads the current sector information explicitly in %s", (matchMode) => {
    useGameStore.setState({ matchMode, sector: sectorById("forge-17") });
    render(<SectorBriefing />);
    expect(speak).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Felolvasás" }));
    expect(speak).toHaveBeenCalledWith(
      expect.stringContaining("SECTOR FORGE-17. Industrial Expanse."),
      "hu",
      undefined,
      0,
      0.4,
      expect.any(Object),
    );
    if (matchMode === "campaign") expect(vi.mocked(speak).mock.calls[0]?.[0]).toContain("Energiareaktor");
    fireEvent.click(screen.getByRole("button", { name: "Értettem" }));
    expect(speak).toHaveBeenCalledOnce();
  });
});
