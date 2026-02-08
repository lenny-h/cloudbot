import { type PanelImperativeHandle } from "react-resizable-panels";

export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function resizeEditor(
  panelRef: React.RefObject<PanelImperativeHandle | null>,
  collapse?: boolean,
) {
  if (panelRef.current?.isCollapsed()) {
    panelRef.current?.resize(50);
  } else if (collapse) {
    panelRef.current?.collapse();
  }
}
