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
