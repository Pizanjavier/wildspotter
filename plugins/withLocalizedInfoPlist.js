const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const LOCALIZED_STRINGS = {
  es: {
    NSLocationWhenInUseUsageDescription:
      "WildSpotter usa tu ubicación para mostrar tu posición en el mapa con un punto azul y ayudarte a encontrar spots de acampada cercanos. Por ejemplo, cuando estés de ruta, puedes centrar el mapa para ver spots descubiertos a tu alrededor.",
  },
};

function withLocalizedInfoPlist(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const iosRoot = path.join(projectRoot, "ios", config.modRequest.projectName);

      for (const [locale, strings] of Object.entries(LOCALIZED_STRINGS)) {
        const lprojDir = path.join(iosRoot, `${locale}.lproj`);
        fs.mkdirSync(lprojDir, { recursive: true });

        const lines = Object.entries(strings)
          .map(([key, val]) => `"${key}" = "${val}";`)
          .join("\n");

        fs.writeFileSync(
          path.join(lprojDir, "InfoPlist.strings"),
          lines + "\n",
          "utf-8"
        );
      }

      return config;
    },
  ]);
}

module.exports = withLocalizedInfoPlist;
