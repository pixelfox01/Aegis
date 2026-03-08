{
  description = "Aegis development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        python = pkgs.python314;
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_22
            nodePackages.npm
            nodePackages.typescript
            nodePackages.typescript-language-server
            python
            uv
            postgresql
            postgresql.lib
            openssl
            gcc
            zlib
          ];
          
          shellHook = ''
            export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath [
              pkgs.stdenv.cc.cc
              pkgs.zlib
              pkgs.postgresql.lib
            ]}:$LD_LIBRARY_PATH"
            export UV_PYTHON=${python}/bin/python
          '';
        };
      }
    );
}
