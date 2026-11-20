# Updating the upstream version

This package builds its image from source. It pulls three upstreams: Dojo itself as a git
submodule, and Tor and Soroban as pinned source builds inside the `Dockerfile`.

## Determining the upstream version

- **Dojo** ([Dojo-Open-Source-Project/samourai-dojo](https://github.com/Dojo-Open-Source-Project/samourai-dojo)) — the release the `samourai-dojo` submodule is checked out at, and the upstream half of the package version:

  ```sh
  gh release view -R Dojo-Open-Source-Project/samourai-dojo --json tagName -q .tagName
  ```

- **Soroban** ([Dojo-Open-Source-Project/soroban](https://github.com/Dojo-Open-Source-Project/soroban)) — pinned by `SOROBAN_VERSION` and `SOROBAN_SHA256` in the `Dockerfile`:

  ```sh
  gh release view -R Dojo-Open-Source-Project/soroban --json tagName -q .tagName
  ```

- **Tor** — pinned by `TOR_VERSION` and `TOR_COMMIT` in the `Dockerfile`, as a tag in the Tor Project's git. This
  build serves Soroban's onion service only; the StartOS `tor` dependency is a separate thing and
  is not pinned here.

  ```sh
  git ls-remote --tags --refs https://gitlab.torproject.org/tpo/core/tor.git 'tor-*' | tail -5
  ```

## Applying the bump

- **Dojo**: check the submodule out at the new tag.

  ```sh
  git -C samourai-dojo fetch --tags
  git -C samourai-dojo checkout v<new version>
  git add samourai-dojo
  ```

  Read `samourai-dojo/RELEASES.md` for the release notes to summarize. If the bump adds or
  renames a `docker/my-dojo/.env` variable that `config.env` maps, update `config.env` in the
  same change.

- **Soroban**: set `SOROBAN_VERSION` in the `Dockerfile` (no leading `v`; the download URL adds it), and
  `SOROBAN_SHA256` to the SHA-256 of that tag's source archive. Upstream publishes no checksums or
  signatures, so hash the exact archive the build downloads, and confirm it was cut from the tag's commit:

  ```sh
  curl -fsSLo soroban.tar.gz https://github.com/Dojo-Open-Source-Project/soroban/archive/refs/tags/v<version>.tar.gz
  sha256sum soroban.tar.gz
  zcat soroban.tar.gz | git get-tar-commit-id   # must equal the ^{} line below
  git ls-remote https://github.com/Dojo-Open-Source-Project/soroban.git 'refs/tags/v<version>*'
  ```

- **Tor**: set `TOR_VERSION` in the `Dockerfile` to the full tag (e.g. `tor-0.4.9.6`), and `TOR_COMMIT`
  to the commit it points to. The build fails if the tag resolves anywhere else. Tor's release tags
  are signed, so verify the signature before pinning, against a signer listed on
  [Tor's verification page](https://support.torproject.org/little-t-tor/verify-little-t-tor/)
  (0.4.9.6 is signed by David Goulet, `B74417EDDF22AC9F9E90F49142E86A2A11F48D36`). If a different
  signer tagged the release, update the fingerprint in the `Dockerfile` comment too.

  ```sh
  git clone --bare --depth 1 --branch tor-<version> https://gitlab.torproject.org/tpo/core/tor.git tor.git
  export GNUPGHOME=$(mktemp -d)
  curl -fsSL https://keys.openpgp.org/vks/v1/by-fingerprint/<FINGERPRINT> | gpg --import
  git -C tor.git tag -v tor-<version>                           # Good signature, Primary key fingerprint = <FINGERPRINT>
  git -C tor.git rev-parse 'refs/tags/tor-<version>^{commit}'   # TOR_COMMIT
  ```
