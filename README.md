# secure-default-vpc-security-group-cdk
## Releasing a new version

- Be on latest main, with no unpublished changes
- Run `npm version (patch|minor|major)` as appropriate
- Run `git push` and `git push origin TAG` where `TAG` is the tag that `npm version` just created

The tag triggers a GitHub Actions job that stages the release on npm.

### Approving the release

Pushing the tag does not put anything in front of consumers. The workflow uses
[staged publishing](https://docs.npmjs.com/staged-publishing/): the version lands
in the registry but is not installable until a maintainer approves it with 2FA.

After the tag job goes green, approve it in the Staged Packages tab on npmjs.com,
or from the CLI:

```bash
npm stage list
npm stage approve <stage-id>
```

`npm stage reject` discards it instead. A staged version occupies its version
number, so to stage the same version again, reject the existing stage first.

### Authentication

Publishing uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/)
over OIDC, so there is no `NPM_TOKEN` secret. The job requests `id-token: write`
and the npm CLI exchanges that for a short-lived token, which also generates
provenance attestations automatically.

The trust relationship is configured on npmjs.com under the package's settings,
naming the organisation, the repository, and the workflow filename
(`publish.yaml`). Existing configurations cannot be edited, only deleted and
recreated.

Staged publishing needs npm 11.15.0 or later, above what Node 24 bundles, so the
workflow installs npm explicitly and asserts the version. Below that floor the
CLI falls back to token authentication and fails with a misleading `E404`.

OIDC covers `npm publish` and `npm stage publish` only. The approve, reject, list
and view subcommands need interactive authentication and cannot use it.
