import { useT } from "@/i18n";
import { ConfirmDialog } from "./ConfirmDialog";

export function BattleExitDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const t = useT();
  return (
    <ConfirmDialog
      title={t("battleExit.title")}
      message={t("battleExit.warning")}
      cancelLabel={t("battleExit.cancel")}
      confirmLabel={t("battleExit.confirm")}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
