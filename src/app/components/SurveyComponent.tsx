'use client';
import Overwrite from '@/types/utils/Overwrite';
import { Packages } from 'apm-schema';
import { memo, useCallback, useEffect, useState } from 'react';
import { Model, StylesManager, type SurveyModel } from 'survey-core';
import 'survey-core/defaultV2.min.css';
import { bootstrapThemeName } from 'survey-core/plugins/bootstrap-integration';
import { Survey } from 'survey-react-ui';
import surveyJson from '../data/survey.json';
import ArchiveComponent from './ArchiveComponent';

type PackageData = Packages['packages'][number];

StylesManager.applyTheme(bootstrapThemeName);

const SurveyComponent = memo(
  (props: {
    packageItem: PackageData | null;
    onComplete: (jsonObject: PackageData) => void;
  }) => {
    const [survey, setSurvey] = useState<SurveyModel>(new Model(surveyJson));

    type SurveyData = Overwrite<
      PackageData,
      {
        dependencies?: string;
        downloadURLs: string;
        releases: {
          version: string;
          archive: string;
          file: {
            target: string;
            hash: string;
          }[];
        }[];
      }
    >;

    useEffect(() => {
      const survey = new Model(surveyJson);
      if (props.packageItem === null) {
        survey.data = {};
      } else {
        const preData = JSON.parse(
          JSON.stringify(props.packageItem),
        ) as PackageData;

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
        const { dependencies, downloadURLs, releases, ...rest } =
          s.data as SurveyData;
        const newData = { ...rest } as PackageData;
        // convert
        if (dependencies)
          newData.dependencies = dependencies.trim().split(/\n/);
        newData.downloadURLs = downloadURLs.trim().split(/\n/) as [
          string,
          ...string[],
        ];
        if (releases)
          newData.releases = releases.map((release) => {
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
      (
        filesJson: SurveyData['files'],
        release: {
          integrity: {
            archive: string;
            file: {
              hash: string;
              target: string;
            }[];
          };
        },
      ) => {
        const packageItem = { ...(survey.data as SurveyData) };
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
        survey.data = packageItem;
      },
      [survey],
    );

    return (
      <div>
        {survey && <Survey model={survey} />}
        <div className="p-3">
          <h5>インストール時にコピーするファイルの指定</h5>
          <div>
            <p>
              「パッケージの最新バージョン」に指定したバージョンのzipファイル（またはファイル）を
              {survey &&
                (survey.data as SurveyData).downloadURLs &&
                (survey.data as SurveyData).downloadURLs
                  .trim()
                  .split(/\n/)[0] && (
                  <a
                    className=""
                    href={
                      (survey.data as SurveyData).downloadURLs
                        .trim()
                        .split(/\n/)[0]
                    }
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
