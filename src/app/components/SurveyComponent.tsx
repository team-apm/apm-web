import React, { useState, useEffect, useCallback, memo } from 'react';
import { Packages } from 'apm-schema';
import * as Survey from 'survey-react';
import 'survey-react/survey.css';
import surveyJson from '../data/survey.json';
import ArchiveComponent from './ArchiveComponent';

Survey.StylesManager.applyTheme('bootstrap');

const SurveyComponent = memo(
  (props: {
    packageItem: Packages['packages'][number] | null;
    onComplete: (jsonObject: Packages['packages'][number]) => void;
  }) => {
    const [survey, setSurvey] = useState<Survey.SurveyModel>();

    useEffect(() => {
      if (!props.packageItem) {
        setSurvey(undefined);
        return;
      }

      const survey = new Survey.Model(surveyJson);
      if (Object.keys(props.packageItem).length === 0) {
        survey.data = {};
      } else {
        const preData = JSON.parse(
          JSON.stringify(props.packageItem),
        ) as Packages['packages'][number];

        // convert
        survey.data = {
          ...preData,
          dependencies: preData.dependencies?.join('\n'),
          downloadURLs: preData.downloadURLs.join('\n'),
          releases: preData.releases?.map((release) => {
            return { version: release.version, ...release.integrity };
          }),
        };
      }
      survey.onComplete.add((s) => {
        const newData = s.data;

        // convert
        if (newData.dependencies)
          newData.dependencies = newData.dependencies.trim().split(/\n/);
        newData.downloadURLs = newData.downloadURLs.trim().split(/\n/);
        if (newData.releases)
          newData.releases = newData.releases.map((release) => {
            return {
              version: release.version,
              integrity: { archive: release.archive, file: release.file },
            };
          });

        props.onComplete(newData);
      });

      setSurvey(survey);
    }, [props, props.packageItem]);

    const archiveComplete = useCallback(
      (filesJson, release) => {
        const packageItem = { ...survey!.data };
        packageItem.files = filesJson;
        if (packageItem?.latestVersion) {
          if (!packageItem?.releases) packageItem.releases = [];
          packageItem.releases = packageItem.releases.filter(
            (r) => r.version !== packageItem.latestVersion,
          );
          packageItem.releases.push({
            ...release.integrity,
            version: packageItem.latestVersion,
          });
        }
        survey!.data = packageItem;
      },
      [survey],
    );

    return (
      <div>
        {survey && <Survey.Survey model={survey} />}
        <div className="p-3">
          <h5>インストール時にコピーするファイルの指定</h5>
          <div>
            <p>
              「パッケージの最新バージョン」に指定したバージョンのzipファイル（またはファイル）を
              {survey?.data?.downloadURLs?.trim().split(/\n/)[0] && (
                <a
                  className=""
                  href={survey.data.downloadURLs.trim().split(/\n/)[0]}
                  target="_blank"
                  rel="noreferrer"
                >
                  ダウンロードして
                </a>
              )}
              点線の欄にドロップします。左の欄に追加されたファイルを右の欄へ移動することでコピーするファイルを指定できます。
            </p>
          </div>
          <ArchiveComponent onComplete={archiveComplete} />
        </div>
      </div>
    );
  },
);
export default SurveyComponent;
