import { useState } from "react";
import { useGameStore } from "@/game/state/gameStore";
import { useBriefingPreferences } from "@/game/state/briefingPreferences";
import { useT } from "@/i18n";
import { ReadAloudButton } from "./ReadAloudButton";
import { ReadAloudText, useReadAloud } from "./ReadAloudText";

export function SectorBriefing() {
  const t = useT();
  const sector = useGameStore((s) => s.sector);
  const matchMode = useGameStore((s) => s.matchMode);
  const { hiddenSectorIds, hide, error } = useBriefingPreferences();
  const [visible, setVisible] = useState(true);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const objectivesText =
    matchMode !== "skirmish" && sector.strategicObjectives?.length
      ? matchMode === "operation"
        ? t("veylora.protection")
        : `${t("strategic.protected")}: ${sector.strategicObjectives.map((objective) => t(`strategic.${objective.type}`)).join(", ")}. ${t("strategic.trial")}`
      : "";
  const briefingText = t(sector.briefing);
  const nameOffset = sector.code.length + 2;
  const briefingOffset = nameOffset + sector.name.length + 2;
  const spokenText = `${sector.code}. ${sector.name}. ${briefingText} ${objectivesText}`;
  const speech = useReadAloud(visible && !hiddenSectorIds.includes(sector.id) ? spokenText : "");

  if (!visible || hiddenSectorIds.includes(sector.id)) return null;

  return (
    <div className="sector-briefing" role="status" aria-label={t("sector.briefing")}>
      <section
        className="sector-briefing-panel"
        aria-label={t("sector.briefing")}
        onKeyDown={(event) => event.stopPropagation()}
        onKeyUp={(event) => event.stopPropagation()}
      >
        <div className="sector-briefing-eyebrow">SECTOR BRIEFING</div>
        <div className="sector-code">
          <ReadAloudText text={sector.code} range={speech.range} />
        </div>
        <h2>
          <ReadAloudText text={sector.name} offset={nameOffset} range={speech.range} />
        </h2>
        <p>
          <ReadAloudText text={briefingText} offset={briefingOffset} range={speech.range} />
        </p>
        {objectivesText && (
          <p>
            <ReadAloudText
              text={objectivesText}
              offset={briefingOffset + briefingText.length + 1}
              range={speech.range}
            />
          </p>
        )}
        <label className="sector-briefing-preference">
          <input type="checkbox" checked={dontShowAgain} onChange={(event) => setDontShowAgain(event.target.checked)} />
          <span>{t("sector.briefingDontShowAgain")}</span>
        </label>
        {error && <p role="alert">{t(error)}</p>}
        <ReadAloudButton text={spokenText} playback={speech} />
        <button
          className="btn"
          onClick={() => {
            if (!dontShowAgain || hide(sector.id)) setVisible(false);
          }}
        >
          {t("sector.briefingClose")}
        </button>
      </section>
    </div>
  );
}
