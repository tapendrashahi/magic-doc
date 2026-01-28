// Keyboard shortcuts handler
export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
}

export class KeyboardShortcutManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();

  register(shortcut: KeyboardShortcut) {
    const key = this.generateKey(shortcut);
    this.shortcuts.set(key, shortcut);
  }

  private generateKey(shortcut: KeyboardShortcut): string {
    const parts = [];
    if (shortcut.ctrlKey) parts.push('ctrl');
    if (shortcut.shiftKey) parts.push('shift');
    if (shortcut.altKey) parts.push('alt');
    parts.push(shortcut.key.toLowerCase());
    return parts.join('+');
  }

  handleKeyDown(event: KeyboardEvent) {
    const key = this.generateKey({
      key: event.key,
      ctrlKey: event.ctrlKey || event.metaKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
    });

    const shortcut = this.shortcuts.get(key);
    if (shortcut) {
      event.preventDefault();
      shortcut.action();
    }
  }

  getShortcuts() {
    return Array.from(this.shortcuts.values());
  }
}

export const keyboardManager = new KeyboardShortcutManager();
