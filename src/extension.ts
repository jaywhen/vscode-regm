import type { TextDocument } from "vscode";
import { commands, ExtensionContext, window, StatusBarAlignment, workspace } from "vscode";
import { ConfigPanel } from "./panels/ConfigPanel";
import { REGM_KEY } from "./constants";
import { IRegMatcher } from "./interfaces";

function getMatchesNum(document: TextDocument | undefined, regExp: string): number {
  if (!document) {
    return 0;
  }

  const matches = document.getText().match(new RegExp(regExp, "g"));

  if (matches) {
    return matches.length;
  }

  return 0;
}

export function activate(context: ExtensionContext) {
  /** define config command */
  const configCommand = "regm.config";

  /** create && init a status bar */
  const statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 100);
  statusBarItem.tooltip = "regular expression match";
  statusBarItem.command = configCommand;

  /** Add command to the extension context */
  context.subscriptions.push(
    commands.registerCommand("regm.config", () => {
      ConfigPanel.render(context.extensionUri, context.globalState);
    })
  );

  /** Listening for changes in the ActiveTextEditor */
  context.subscriptions.push(window.onDidChangeActiveTextEditor(updateStatusBarItem));

  /** Listening for changes in document content */
  workspace.onDidChangeTextDocument(() => {
    updateStatusBarItem();
  });

  function updateStatusBarItem(): void {
    let matchers = context.globalState.get(REGM_KEY);

    if (!Array.isArray(matchers)) {
      matchers = [];
      context.globalState.update(REGM_KEY, matchers);
      context.globalState.setKeysForSync([REGM_KEY]);
    }

    const matcher = (matchers as IRegMatcher[]).find((matcher) => matcher.isSelected);

    if (matcher) {
      const matchesNum = getMatchesNum(window.activeTextEditor?.document, matcher.regExp);
      statusBarItem.text = `${matcher.regExpName}: ${matchesNum}`;
    } else {
      statusBarItem.text = "REGM";
    }

    statusBarItem.show();
  }

  updateStatusBarItem();
}
