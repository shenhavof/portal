import { useCycle } from "../context/CycleContext";
import { useTranslation } from "react-i18next";
import "../styles/BackToCurrentCycle.css"; // ← תוודאי שהקובץ קיים

export default function BackToCurrentCycle() {
  const { setSelectedIndex } = useCycle();
  const { t } = useTranslation();

  const handleClick = () => {
    setSelectedIndex(0); // רק להחליף מחזור, בלי ניווט
  };

  return (
    <button className="back-to-current-btn ova-btn" onClick={handleClick}>
      {t("closedCycleButton")}
    </button>
  );
}
