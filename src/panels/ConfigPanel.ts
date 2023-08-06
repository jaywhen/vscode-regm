import type { ExtensionContext } from "vscode";
import { Disposable, Webview, WebviewPanel, window, Uri, ViewColumn } from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import { REGM_KEY } from "../constants";
import { IAddOrUpdateRegMatcher, IRegMatcher } from "../interfaces";

export class ConfigPanel {
  public static currentPanel: ConfigPanel | undefined;
  private readonly _panel: WebviewPanel;
  private readonly _store: ExtensionContext["globalState"];
  private _disposables: Disposable[] = [];

  private constructor(
    panel: WebviewPanel,
    extensionUri: Uri,
    store: ExtensionContext["globalState"]
  ) {
    this._panel = panel;
    this._store = store;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);

    this._setWebviewMessageListener(this._panel.webview);
    this._panel.onDidChangeViewState((e) => {
      this._panel.webview.postMessage({
        type: "initData",
        data: store.get(REGM_KEY) ?? [],
      });
    });
  }

  public static render(extensionUri: Uri, store: ExtensionContext["globalState"]) {
    if (ConfigPanel.currentPanel) {
      ConfigPanel.currentPanel._panel.reveal(ViewColumn.One);
    } else {
      const panel = window.createWebviewPanel("ConfigPanel", "Reg Exp Config", ViewColumn.One, {
        enableScripts: true,
        localResourceRoots: [
          Uri.joinPath(extensionUri, "out"),
          Uri.joinPath(extensionUri, "webview-ui/build"),
        ],
      });

      ConfigPanel.currentPanel = new ConfigPanel(panel, extensionUri, store);

      ConfigPanel.currentPanel._panel.webview.postMessage({
        type: "initData",
        data: store.get(REGM_KEY) ?? [],
      });
    }
  }

  public dispose() {
    ConfigPanel.currentPanel = undefined;
    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private _getWebviewContent(webview: Webview, extensionUri: Uri) {
    const stylesUri = getUri(webview, extensionUri, ["webview-ui", "build", "assets", "index.css"]);
    const scriptUri = getUri(webview, extensionUri, ["webview-ui", "build", "assets", "index.js"]);

    const nonce = getNonce();

    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>Reg Exp Config</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }

  private _setWebviewMessageListener(webview: Webview) {
    webview.onDidReceiveMessage(
      (message: any) => {
        switch (message.type) {
          case "addOrUpdate":
            this.addOrUpdateRegMatcher(message.data);
            return;
          case "remove":
            this.removeRegMatcher(message.data);
            return;
          case "updateAll":
            this.updateAllMatchers(message.data);
          default:
            return;
        }
      },
      undefined,
      this._disposables
    );
  }

  private addOrUpdateRegMatcher(regMatcher: IAddOrUpdateRegMatcher): void {
    const matchers = this.queryRegMatchers();

    if (regMatcher.index < 0) {
      /** add */
      matchers.push(regMatcher);
    } else {
      /** update */
      matchers[regMatcher.index] = {
        regExpName: regMatcher.regExpName,
        regExp: regMatcher.regExp,
        isSelected: regMatcher.isSelected,
      };
    }

    this.updateRegMatchers(matchers);
  }

  private removeRegMatcher(index: number): void {
    const matchers = this.queryRegMatchers();
    matchers.splice(index, 1);
    this.updateRegMatchers(matchers);
  }

  private updateAllMatchers(matchers: IRegMatcher[]): void {
    this.updateRegMatchers(matchers);
  }

  private queryRegMatchers(): IRegMatcher[] {
    let matchers = this._store.get(REGM_KEY);

    if (!Array.isArray(matchers)) {
      matchers = [];
    }

    return matchers as IRegMatcher[];
  }

  private updateRegMatchers(matchers: IRegMatcher[]): void {
    this._store.update(REGM_KEY, matchers);
    this._store.setKeysForSync([REGM_KEY]);
  }
}
