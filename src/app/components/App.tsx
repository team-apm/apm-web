'use client';

import { useCallback, useEffect, useState } from 'react';
import { Packages } from 'apm-schema';
import Fuse from 'fuse.js';
import {
  Badge,
  Button,
  Col,
  Container,
  Form,
  FormControl,
  FormLabel,
  InputGroup,
  ListGroup,
  ListGroupItem,
  Modal,
  ModalBody,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  Nav,
  Navbar,
  NavbarBrand,
  NavbarCollapse,
  NavbarToggle,
  NavLink,
  Row,
  Stack,
} from 'react-bootstrap';
import './App.css';
import SurveyComponent from './SurveyComponent';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './main.css';

type PackageData = Packages['packages'][number];

const formsUrl =
  'https://docs.google.com/forms/d/e/1FAIpQLSfxQWxsCp9QQYHpe9oxL4gZEdJmMVQxFZijXKI1NmygeHgHkg/viewform?usp=pp_url';
const formsAttribute = { name: 'entry.1336975935', data: 'entry.447338863' };

function makeFormsUrl(data: Record<string, string>) {
  let url = formsUrl;
  for (const key of Object.keys(formsAttribute)) {
    if (Object.prototype.hasOwnProperty.call(data, key))
      url += '&' + formsAttribute[key] + '=' + encodeURIComponent(data[key]);
  }
  return url;
}

function App() {
  const [packageItem, setPackageItem] = useState<PackageData | null>();
  const [packages, setPackages] = useState<Record<string, PackageData>>({});
  const [addedPackages, setAddedPackages] = useState<
    Record<string, PackageData>
  >({});
  const [searchString, setSearchString] = useState('');
  const [loadModalString, setLoadModalString] = useState<string>('');
  const [loadModalStringIsValid, setLoadModalStringIsValid] = useState(false);

  const [showSendModal, setShowSendModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);

  const handleCloseSendModal = () => setShowSendModal(false);
  const handleShowSendModal = () => setShowSendModal(true);
  const handleCloseLoadModal = () => setShowLoadModal(false);
  const handleShowLoadModal = () => setShowLoadModal(true);

  useEffect(() => {
    async function fetchJson() {
      const text = await (
        await fetch(
          'https://cdn.jsdelivr.net/gh/team-apm/apm-data@main/v3/packages.json',
        )
      ).text();
      setPackages(
        Object.assign(
          {},
          ...(JSON.parse(text) as Packages).packages.map((x) => ({
            [x.id]: x,
          })),
        ) as Record<string, PackageData>,
      );

      const tmpAddedPackges =
        (JSON.parse(localStorage.getItem('v3-packages') ?? '{}') as Record<
          string,
          PackageData
        >) ?? {};

      // migration v2 to v3
      const v2Data =
        (JSON.parse(localStorage.getItem('packages') ?? '{}') as Record<
          string,
          PackageData
        >) ?? {};
      if (Object.keys(v2Data).length !== 0) {
        tmpAddedPackges['_notify/update-v3'] = {
          id: '_notify/update-v3',
          developer: 'apm-web',
          name: '【お知らせ】apm-webの更新',
          overview:
            'パッケージデータの形式が変わりました。これまでのデータは下の説明欄にあります。お手数ですが必要な場合は再度入力をお願いします。',
          downloadURLs: [''],
          description: JSON.stringify(Object.values(v2Data), null, '  '),
          pageURL: '',
          latestVersion: '',
          files: [],
        };

        localStorage.setItem('v3-packages', JSON.stringify(tmpAddedPackges));
        localStorage.removeItem('packages');
      }
      // end migration

      setAddedPackages(tmpAddedPackges);
    }
    void fetchJson();
  }, []);

  const surveyComplete = useCallback(
    (json: PackageData) => {
      const newPackages = { ...addedPackages };
      newPackages[json.id] = json;
      setAddedPackages(newPackages);
      setPackageItem(json);
      localStorage.setItem('v3-packages', JSON.stringify(newPackages));
    },
    [addedPackages],
  );

  function loadModalStringChange(strJson: string) {
    try {
      const _json = JSON.parse(strJson) as PackageData | PackageData[];
      const json = Array.isArray(_json) ? _json : [_json];
      setLoadModalStringIsValid(json.some((p) => Object.hasOwn(p, 'id')));
    } catch {
      setLoadModalStringIsValid(false);
    }
    setLoadModalString(strJson);
  }

  const loadModalComplete = (strJson: string) => {
    const _json = JSON.parse(strJson) as PackageData | PackageData[];
    const json = Array.isArray(_json) ? _json : [_json];
    const newPackages = { ...addedPackages };

    json
      .filter((p) => Object.hasOwn(p, 'id'))
      .map((p) => (newPackages[p.id] = p));
    setAddedPackages(newPackages);
    localStorage.setItem('v3-packages', JSON.stringify(newPackages));
  };

  function submit() {
    const formsUrl = makeFormsUrl({
      data: JSON.stringify(Object.values(addedPackages), null, '  '),
    });

    if (formsUrl.length < 8000) {
      window.open(formsUrl);
    } else {
      handleShowSendModal();
    }
  }

  const options = {
    threshold: 0.3,
    keys: ['id', 'name', 'overview', 'description', 'developer'],
  };

  const merged = Object.values(Object.assign({}, packages, addedPackages));
  const ps = searchString
    ? new Fuse(merged, options).search(searchString).map((p) => p.item)
    : merged;
  function createItem(p: PackageData, badge?: string) {
    function removeItem(id: string) {
      const newPackages = { ...addedPackages };
      delete newPackages[id];
      setAddedPackages(newPackages);
      localStorage.setItem('v3-packages', JSON.stringify(newPackages));
    }

    return (
      <ListGroupItem
        action
        active={
          !!packageItem &&
          Object.hasOwn(packageItem, 'id') &&
          p.id === packageItem.id
        }
        className={
          'position-relative' +
          (ps.filter((pp) => pp.id === p.id).length > 0 ? '' : ' d-none')
        }
        key={p.id}
        onClick={() => setPackageItem(p)}
      >
        {badge === 'new' && (
          <Badge bg="success" className="me-2">
            New
          </Badge>
        )}
        {badge === 'edit' && (
          <Badge bg="warning" className="me-2">
            Edit
          </Badge>
        )}
        {p?.name ? p.name : p.id}
        {badge && ['new', 'edit'].includes(badge) && (
          <div
            className="position-absolute top-50 end-0 translate-middle-y fs-4 px-3"
            onClick={() => removeItem(p.id)}
          >
            ×
          </div>
        )}
      </ListGroupItem>
    );
  }

  return (
    <>
      <Modal
        show={showSendModal}
        onHide={handleCloseSendModal}
        aria-labelledby="sendModalLabel"
      >
        <ModalDialog size="lg" centered>
          <ModalHeader closeButton>
            <ModalTitle id="sendModalLabel">
              <i className="bi bi-send me-2"></i>プレビューと送信
            </ModalTitle>
          </ModalHeader>
          <ModalBody>
            <form>
              <div className="mb-3">
                <FormLabel column htmlFor="message-text">
                  以下の文字列を送信ページのデータ欄にコピーアンドペーストしてください。
                </FormLabel>
                <FormControl
                  as="textarea"
                  id="message-text"
                  value={JSON.stringify(
                    Object.values(addedPackages),
                    null,
                    '  ',
                  )}
                  rows={6}
                  readOnly
                ></FormControl>
              </div>
            </form>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={handleCloseSendModal}>
              閉じる
            </Button>
            <Button
              variant="primary"
              onClick={() => window.open(makeFormsUrl({}))}
            >
              送信ページを開く
            </Button>
          </ModalFooter>
        </ModalDialog>
      </Modal>
      <Modal
        show={showLoadModal}
        onHide={handleCloseLoadModal}
        aria-labelledby="loadModalLabel"
      >
        <ModalDialog size="lg" centered>
          <ModalHeader closeButton>
            <ModalTitle id="loadModalLabel">
              <i className="bi bi-send me-2"></i>パッケージデータの読み込み
            </ModalTitle>
          </ModalHeader>
          <ModalBody>
            <form>
              <div className="mb-3">
                <FormLabel column htmlFor="loadModalText">
                  パッケージデータを以下の欄にコピーアンドペーストしてください。
                </FormLabel>
                <FormControl
                  as="textarea"
                  className={loadModalStringIsValid ? '' : ' is-invalid'}
                  id="loadModalText"
                  value={loadModalString}
                  onChange={(e) => loadModalStringChange(e.target.value)}
                  rows={6}
                  placeholder={
                    '例：\r\n' +
                    JSON.stringify([packages['aoytsk/easymp4']], null, '  ')
                  }
                ></FormControl>
              </div>
            </form>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={handleCloseLoadModal}>
              閉じる
            </Button>
            <Button
              variant="primary"
              disabled={!loadModalStringIsValid}
              onClick={() => loadModalComplete(loadModalString)}
            >
              読み込む
            </Button>
          </ModalFooter>
        </ModalDialog>
      </Modal>
      <Container fluid id="root" className="g-0 d-flex flex-column">
        <Navbar expand="lg" variant="light" fixed="top" bg="light">
          <Container fluid>
            <NavbarBrand
              href="https://team-apm.github.io/apm/"
              target="_blank"
              rel="noreferrer"
            >
              <span className="align-middle">apm-web</span>
            </NavbarBrand>
            <NavbarToggle aria-controls="navbarSupportedContent" />
            <NavbarCollapse id="navbarSupportedContent">
              <Nav className="me-auto mb-2 mb-lg-0">
                <NavLink className="me-3" onClick={() => setPackageItem(null)}>
                  <i className="bi bi-plus-square me-2"></i>
                  パッケージを作る
                </NavLink>
                <NavLink
                  className="me-3"
                  onClick={() => {
                    loadModalStringChange('');
                    handleShowLoadModal();
                  }}
                >
                  <i className="bi bi-filetype-json me-2"></i>
                  パッケージを読み込む
                </NavLink>
                <NavLink
                  className="me-3"
                  href="https://github.com/team-apm/apm-data/issues?q=is%3Aissue+label%3Aplugin%2Cscript"
                  target="_blank"
                  rel="noreferrer"
                >
                  <i className="bi bi-github me-2"></i>
                  みんなの送信パッケージを見る
                </NavLink>
              </Nav>
              <Form className="d-flex">
                <Button
                  variant="success"
                  onClick={submit}
                  disabled={Object.values(addedPackages).length === 0}
                >
                  <i className="bi bi-send me-2"></i>
                  プレビューと送信
                </Button>
              </Form>
            </NavbarCollapse>
          </Container>
        </Navbar>
        <div
          className="flex-grow-1 h-100"
          style={{ paddingTop: '3.57109375rem' }}
        >
          <Row className="g-0 h-100">
            <Col sm="3" className="h-100">
              <Stack className="h-100">
                <InputGroup className="p-2">
                  <FormControl
                    className="shadow-none"
                    type="search"
                    name="name"
                    value={searchString}
                    placeholder="🔍検索"
                    onChange={(e) => setSearchString(e.target.value)}
                  />
                </InputGroup>
                <ListGroup
                  variant="flush"
                  className="overflow-auto h-100 user-select-none"
                >
                  {Object.values(addedPackages)
                    .filter(
                      (p) =>
                        !Object.prototype.hasOwnProperty.call(packages, p.id),
                    )
                    .map((p) => createItem(p, 'new'))}
                  {Object.values(addedPackages)
                    .filter((p) =>
                      Object.prototype.hasOwnProperty.call(packages, p.id),
                    )
                    .map((p) => createItem(p, 'edit'))}
                  {Object.values(packages)
                    .filter(
                      (p) =>
                        !Object.prototype.hasOwnProperty.call(
                          addedPackages,
                          p.id,
                        ),
                    )
                    .map((p) => createItem(p))}
                </ListGroup>
              </Stack>
            </Col>
            <Col sm="9" className="overflow-auto h-100">
              {packageItem !== undefined && (
                <SurveyComponent
                  packageItem={packageItem}
                  onComplete={surveyComplete}
                />
              )}
            </Col>
          </Row>
        </div>
      </Container>
    </>
  );
}

export default App;
