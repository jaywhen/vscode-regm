import { VSCodeButton, VSCodeTextField, VSCodeTextArea } from "@vscode/webview-ui-toolkit/react";
import React, { useEffect, useState } from "react";
import { vscode } from "./utilities/vscode";
import { IRegMatcher } from "./interfaces";
import "./index.css";

const App = () => {
  const [regExpName, setRegExpName] = useState("");
  const [regExp, setRegExp] = useState("");
  const [regMatchers, setRegMatchers] = useState<IRegMatcher[]>([]);
  const [isUpdateMatcher, setIsUpdateMatcher] = useState(false);
  const [updateIndex, setUpdateIndex] = useState(-1);

  const handleAddOrUpdate = (): void => {
    const newMatcher = {
      regExpName,
      regExp,
      isSelected: isUpdateMatcher ? regMatchers[updateIndex].isSelected : false,
    };

    /** sync */
    vscode.postMessage({
      type: "addOrUpdate",
      data: {
        index: isUpdateMatcher ? updateIndex : -1,
        ...newMatcher,
      },
    });

    /** update view */
    const newList = [...regMatchers];

    if (isUpdateMatcher) {
      newList[updateIndex] = newMatcher;
    } else {
      newList.push(newMatcher);
    }

    setRegMatchers(newList);
    setRegExpName("");
    setRegExp("");

    if (isUpdateMatcher) {
      setIsUpdateMatcher(false);
      setUpdateIndex(-1);
    }
  };

  const handleRemove = (index: number, e: React.MouseEvent<HTMLElement>): void => {
    /** should add alert */
    e.stopPropagation();

    /** update view */
    const newList = [...regMatchers];
    newList.splice(index, 1);
    setRegMatchers(newList);

    /** sync to extension */
    vscode.postMessage({
      type: "remove",
      data: index,
    });
  };

  const onUpdateMatcher = (index: number, e: React.MouseEvent<HTMLElement>): void => {
    e.stopPropagation();

    setIsUpdateMatcher(true);
    setRegExpName(regMatchers[index].regExpName);
    setRegExp(regMatchers[index].regExp);
    setUpdateIndex(index);
  };

  const selectMatcher = (index: number): void => {
    const newList = [...regMatchers];
    const preSelectedIndex = newList.findIndex((matcher) => matcher.isSelected);

    if (preSelectedIndex !== -1) {
      newList[preSelectedIndex].isSelected = false;
    }

    newList[index].isSelected = true;

    setRegMatchers(newList);

    /** sync */
    vscode.postMessage({
      type: "updateAll",
      data: newList,
    });
  };

  useEffect(() => {
    window.addEventListener("message", (message: MessageEvent) => {
      setRegMatchers(message.data.data);
    });
  }, []);

  return (
    <main className="w-full h-full p-6">
      <div className="mt-2">
        <div className="flex flex-col gap-4 w-[360px]">
          <VSCodeTextField
            maxlength={18}
            value={regExpName}
            onInput={(e) => {
              // @ts-ignore
              setRegExpName(e.target.value);
            }}>
            RegExp Name
          </VSCodeTextField>
          <VSCodeTextArea
            cols={30}
            value={regExp}
            onInput={(e) => {
              // @ts-ignore
              setRegExp(e.target.value);
            }}>
            RegExp
          </VSCodeTextArea>
          <VSCodeButton onClick={handleAddOrUpdate}>
            {isUpdateMatcher ? "Update" : "Add"} Matcher
          </VSCodeButton>
        </div>
        <div className="mt-6 flex flex-col gap-4">
          {regMatchers.map((regMatch, index) => {
            return (
              <div
                key={index}
                onClick={() => selectMatcher(index)}
                style={{ borderColor: regMatch.isSelected ? "#7a7a7a" : "#2f2f2f" }}
                className="flex justify-between border-2 border-[#2f2f2f] rounded-md w-[480px] h-[80px] p-2 cursor-pointer">
                <div className="flex flex-col justify-between">
                  <div>{regMatch.regExpName}</div>
                  <div>{regMatch.regExp}</div>
                </div>
                <div className="w-[140px] flex justify-between items-center">
                  <VSCodeButton appearance="secondary" onClick={(e) => handleRemove(index, e)}>
                    Remove
                  </VSCodeButton>
                  <VSCodeButton onClick={(e) => onUpdateMatcher(index, e)}>Edit</VSCodeButton>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
};

export default App;
