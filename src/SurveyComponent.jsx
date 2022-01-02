import React, { Component } from "react";
import * as Survey from "survey-react";
import "survey-react/survey.css";
import "./index.css";
import surveyJson from './data/survey.json';

Survey.StylesManager.applyTheme("default");

class SurveyComponent extends Component {
    render() {
        const preData = {
            "id": "amate/InputPipePlugin",
            "name": "InputPipePlugin",
            "overview": "AviUtlのメモリ使用量を減らす",
            "description": "このソフトは、L-SMASH_Works File Reader(lwinput.aui)を別プロセスで実行してあげることによって、Aviutlのメモリ使用量削減を目論む、aviutlの入力プラグインです",
            "developer": "amate",
            "dependencies": {
                "dependency": [
                    "pop4bit/LSMASHWorks|VFRmaniac/LSMASHWorks|HolyWu/LSMASHWorks|MrOjii/LSMASHWorks"
                ]
            },
            "pageURL": "https://www.nicovideo.jp/watch/sm35585310",
            "downloadURL": "https://github.com/amate/InputPipePlugin/releases/latest",
            "latestVersion": "v1.8",
            "files": [
                {
                    "filename": "plugins/InputPipeMain.exe",
                    "isOptional": false,
                    "isDirectory": false,
                    "archivePath": "InputPipePlugin/"
                },
                {
                    "filename": "plugins/InputPipePlugin.aui",
                    "isOptional": false,
                    "isDirectory": false,
                    "archivePath": "InputPipePlugin/"
                },
                {
                    "filename": "plugins/InputPipePlugin.log",
                    "isOptional": true,
                    "isDirectory": false,
                    "archivePath": null
                }
            ],
            "releases": {
                "v1.8": {
                    "integrities": [
                        {
                            "target": "plugins/InputPipePlugin.aui",
                            "targetIntegrity": "sha384-ujWRvgLYdr/2XKYMuzfkHSttfgJPXtXsH+StEkpPXj6cXTlJy2F3tha0sr0/lD14"
                        }
                    ]
                }
            },
            "type": [
                "input"
            ]
        }
        preData.dependencies = preData?.dependencies.dependency.join('\r\n');

        const survey = new Survey.Model(surveyJson);
        survey.data = preData;
        survey.onComplete.add((s, o) => {
            const newData = s.data;
            newData.dependencies = newData?.dependencies.trim().split(/\n/);
            console.log(newData);
        });

        return (
            <Survey.Survey
                model={survey}
            />
        );
    }
}

export default SurveyComponent;
