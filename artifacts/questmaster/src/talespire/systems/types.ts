export interface SheetAdapterProps {
  character: Record<string, any>;
  editable: boolean;
  /** Raw sheet onSave payload; the sync layer turns it into a minimal patch. */
  onSheetSave: (save: Record<string, any>) => void;
}
