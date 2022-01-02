import React, { Component } from "react";
import * as Survey from "survey-react";
import "survey-react/survey.css";
import "./index.css";
import surveyJson from './data/survey.json';

Survey.StylesManager.applyTheme("default");

class SurveyComponent extends Component {
    render() {
        const preData = {
            "id": "ePi/patch",
            "name": "patch.aul",
            "overview": "AviUtl ver.1.10や拡張編集Plugin ver.0.92のバグを修正する",
            "description": "AviUtl ver.1.10や拡張編集Plugin ver.0.92に存在するバグを修正します。拡張編集Plugin ver.0.93rc1で修正されたバグも修正します。",
            "developer": "ePi",
            "dependencies": {
                "dependency": [
                    "aviutl1.10",
                    "exedit0.92"
                ]
            },
            "pageURL": "https://scrapbox.io/ePi5131/patch.aul",
            "downloadURL": "https://scrapbox.io/ePi5131/patch.aul",
            "latestVersion": "r8",
            "files": [
                {
                    "filename": "plugins/patch.aul",
                    "isOptional": false,
                    "isDirectory": false,
                    "archivePath": null
                },
                {
                    "filename": "plugins/patch.aul.json",
                    "isOptional": true,
                    "isDirectory": false,
                    "archivePath": null
                }
            ],
            "releases": {
                "r8": {
                    "integrities": [
                        {
                            "target": "plugins/patch.aul",
                            "targetIntegrity": "sha384-Y5+kwXflyU0gp355bol79vADMCZVIZz0yV8mcPXB0lLxNRLxEzqfOJM8BpU1Td9Y"
                        }
                    ]
                }
            },
            "type": [
                "language"
            ]
        }

        // convert
        delete preData.type;
        preData.dependencies = preData?.dependencies.dependency.join('\r\n');
        if (preData?.releases) {
            const tmpReleases = [];
            for (const [key, value] of Object.entries(preData.releases)) {
                tmpReleases.push({ version: key, integrities: value.integrities });
            }
            preData.releases = tmpReleases;
        }


        const survey = new Survey.Model(surveyJson);
        survey.data = preData;
        survey.onComplete.add((s, o) => {
            const newData = s.data;

            // convert
            if (newData?.dependencies)
                newData.dependencies = { dependency: newData?.dependencies.trim().split(/\r\n/) };
            if (newData?.releases) {
                const tmpReleases = {};
                for (const entry of newData.releases) {
                    tmpReleases[entry.version] = { integrities: entry.integrities };
                }
                newData.releases = tmpReleases;
            }


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
