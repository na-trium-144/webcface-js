## [1.11.0] - 2025-01-30
### Added
* Func.index (#263)

## [1.10.0] - 2025-01-15
### Added
* Field::member(), name(), child(), children(), hasChildren(), 各種データ型の関数(value(), text(), ...と、 valueEntries(), textEntries(), ...) (#255)
	* Member.values() -> valueEntries() に名前変更
	* Value, Textなど各種データ型, Member, ClientがFieldを継承するのをやめた
* Viewの要素にwidth, heightプロパティ追加 (#254)
### Changed
* AnonymousFuncクラス削除 (#255)

## [1.9.1] - 2024-11-30
### Fixed
* syncInitの受信時にそのメンバーの過去のデータを消すようにした (#238)

## [1.9.0] - 2024-10-01
### Added
* 新Logメッセージ(kind=8)に対応 (#207)
* Field.logEntries()
* Member.onLogEntry()
### Changed
* eslintをv9にアップデートしたのでnode16ではテストが通りません (#211)

## [1.8.1] - 2024-09-16
### Fixed
* サーバーに未接続のときのReq送信を修正 (#198)

## [1.8.0] - 2024-09-04
### Added
* 各種Field.exists() (#187)
	* リクエストを送らずに、Entryを受信したかどうかを取得する
* Log.keepLines (#188)
	* 指定した行数以上のログをClientが保持しないようにした
* Member.requestPingStatus() 追加 (#191)
### Changed
* LogEntryメッセージ実装 (#187)
* log4js依存を削除 (#189)
	* Client.logAppender() 削除
	* Log.append() 追加
* AsyncFuncResult → FuncPromise (#190)
	* started→reach, result→finish
	* finishのエラー値が常にError型で返るようにした
	* setter関数などをFuncPromiseDataクラスに分離
* syncDataFirstの仕様をC++に合わせた (#190)
	* クライアントが未接続のときrunAsync()は関数呼び出しを送信しないようにした

## [1.7.0] - 2024-08-29
### Added
* WebCFace ver2.0に対応する機能追加 (#167)
	* Client.serverHostName 追加
	* Member.pingStatus でClient自身のping値を取得できるようにした
* webpackでビルドできるようにした (#172)
	* CDNからWebCFaceを直接HTMLに読み込むことができます
### Changed
* Client.member() が引数が空文字列の時thisを返す (#167)

## [1.6.0] - 2024-04-07
### Added
* Viewにinput要素追加 (#125, #128, #133)
* InputRef
* ViewComponent.id, Canvas2dComponent.id
### Changed
* exampleを内容別に分割 (#128)
* Value.getVec()がarrayのコピーを返すようにした (#126)
* 各種field.time() を Member.syncTime() に移行 (#127)

## [1.5.1] - 2024-03-16
### Added
* Canvas2D.text, textSize (#116)
* Canvas2DComponentTypeのexport追加
### Changed
* Canvas2D.strokeWidthの初期値を1から0に変更 (#116)

## [1.5.0] - 2024-03-13
### Added
* Canvas2D.onClick
### Changed
* geometriesの各関数の戻り値の型を変更
* Canvas2D.add, Canvas3D.add の引数変更

## [1.4.1] - 2024-03-08
### Changed
* Value, Textで値が変化したときのみ送信するようにした (#107)
### Fixed
* Clientの初期化後すぐに Client.close() を呼ぶとcloseされないのを修正 (#107)

## [1.4.0] - 2024-02-15
### Added
* Canvas2D (#92)

## [1.3.1] - 2024-01-17
### Fixed
* jointがfixedAbsoluteのときのRobotLink.originFromBaseを修正 (#81)
### Added
* anglesを適用したあとの座標変換を計算するRobotLink.getOriginFromBase()を追加 (#81)
* imageのリクエストオプションにframeRateを追加 (#82)

## [1.3.0] - 2024-01-10
### Added
* RobotModel, Canvas3D (#67)
### Fixed
* Imageのentryが再接続で重複するバグを修正 (#67)

## [1.2.0] - 2023-12-26
### Added
* Image, ImageFrame, ImageReq (#54)

## [1.1.1] - 2023-12-23
### Fixed
* ブラウザーでprocess is not definedエラーになるのを修正 (#62)

## [1.1.0] - 2023-12-18
### Added
* `Value.request()` (Text, Logなども同様) (#50)
* node.js 16と20でのテストをciに追加
### Changed
* `Client.start()`を追加し、Clientオブジェクトを生成するだけでは通信が開始しなくなった (#50)
* リクエストは毎周期sync()しなくても送るようにした
* webcfaceの内部のログ表示の有無を環境変数またはClientのlogLevelプロパティで変えられるようにした (#55)

## [1.0.4] - 2023-11-30
### Added
* APIドキュメント (#27)
* `View.child()`
* `Log.clear()`
### Changed
* log4jsをdependencyにした
* `FieldWithEvent`を`EventTarget`に変更
* 一部のプロパティにprivate, protectを設定
* ViewComponentの各種セッターを削除
* `Func.hidden`プロパティを削除
* updated dependencies

## [1.0.3] - 2023-10-14
### Fixed
* memberが再接続したときにViewのEntryが増えるバグを修正 (#18)
* onSyncイベントが発生した時点でまだデータが更新されていない問題を修正 (#18)

## [1.0.2] - 2023-10-10
### Added
* Typedocを設定しました (#1)
	* (ドキュメントはまったく書いてない)
* PRでのGithub Actionsのチェックにeslintを追加 (#8)
* 接続完了前にsync()を呼び出した場合、接続完了時に自動でsync()するようにした (#15)

### Fixed
* 再接続後の通信の不具合を修正 (#15)

### Changed
* updated dependencies (#7, #4)

## [1.0.1] - 2023-09-28
