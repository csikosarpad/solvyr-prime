import { useId } from "react";
import { armorColorMatrix, tankTint } from "@/game/state/playerColors";
import type { UnitPresentation } from "./result.types";

interface UnitIllustrationProps {
  presentation: UnitPresentation;
  facing?: "left" | "right";
}

function tintMatrix(color: number): string {
  const red = ((color >> 16) & 255) / 255;
  const green = ((color >> 8) & 255) / 255;
  const blue = (color & 255) / 255;
  return `${red} 0 0 0 0 0 ${green} 0 0 0 0 0 ${blue} 0 0 0 0 0 1 0`;
}

export function UnitIllustration({ presentation, facing = "right" }: UnitIllustrationProps) {
  const tintId = useId();
  if (!presentation.silhouetteAsset) return null;

  if (presentation.illustrationLayout === "body-barrel" || presentation.illustrationLayout === "soldier") {
    const paint = presentation.paintedBody;
    const soldier = presentation.illustrationLayout === "soldier";
    const paintTint = soldier ? presentation.paintTint : paint?.tint;
    const paintTintId = `${tintId}-armor`;
    const paintFilter = paintTint !== undefined ? `url(#${paintTintId})` : undefined;
    return (
      <div
        className={`unit-illustration unit-illustration-platform accent-${presentation.accent} facing-${facing}`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 36 16" focusable="false">
          <defs>
            <filter id={tintId} colorInterpolationFilters="sRGB">
              <feColorMatrix
                type="matrix"
                values={tintMatrix(tankTint(presentation.primaryColor))}
              />
            </filter>
            {paintTint !== undefined && (
              <filter id={paintTintId} colorInterpolationFilters="sRGB">
                <feColorMatrix type="matrix" values={armorColorMatrix(paintTint).join(" ")} />
              </filter>
            )}
          </defs>
          {presentation.secondaryAsset && (
            <image
              href={presentation.secondaryAsset}
              x="16"
              y={soldier ? 8 : 4}
              width="16"
              height="4"
              transform={soldier ? "rotate(-20 16 10)" : "rotate(-20 16 6)"}
              filter={paintFilter}
            />
          )}
          {soldier ? (
            <image href={presentation.silhouetteAsset} x="4" y="0" width="24" height="16" preserveAspectRatio="none" filter={paintFilter} />
          ) : paint ? (
            <>
              <image href={paint.chassis} x="4" y="4" width="24" height="12" />
              <image href={paint.armor} x="4" y="4" width="24" height="12" filter={paintFilter} />
              <image href={paint.details} x="4" y="4" width="24" height="12" />
            </>
          ) : (
            <image href={presentation.silhouetteAsset} x="4" y="4" width="24" height="12" />
          )}
          {presentation.accentAsset && (
            <image href={presentation.accentAsset} x="4" y={soldier ? 0 : 4} width="24" height={soldier ? 16 : 12}
              preserveAspectRatio={soldier ? "none" : undefined} filter={`url(#${tintId})`} />
          )}
        </svg>
      </div>
    );
  }

  return (
    <div className={`unit-illustration accent-${presentation.accent} facing-${facing}`} aria-hidden="true">
      <img className="unit-illustration-body" src={presentation.silhouetteAsset} alt="" />
      {presentation.secondaryAsset && (
        <img className="unit-illustration-secondary" src={presentation.secondaryAsset} alt="" />
      )}
      {presentation.detailAsset && <img className="unit-illustration-details" src={presentation.detailAsset} alt="" />}
      {presentation.accentAsset && <img className="unit-illustration-accent" src={presentation.accentAsset} alt="" />}
    </div>
  );
}
