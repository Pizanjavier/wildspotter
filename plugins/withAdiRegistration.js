const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Expo Config Plugin: withAdiRegistration
 *
 * Copies the `adi-registration.properties` file from the project root
 * into the Android APK's Java resources directory during prebuild.
 *
 * This is required by Google Play Console for package name verification.
 * The file ends up at: android/app/src/main/resources/adi-registration.properties
 * which places it at the root of the Java resources inside the final APK.
 */
function withAdiRegistration(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const sourcePath = path.join(projectRoot, "adi-registration.properties");
      const destDir = path.join(
        projectRoot,
        "android",
        "app",
        "src",
        "main",
        "resources"
      );
      const destPath = path.join(destDir, "adi-registration.properties");

      // Verify the source file exists
      if (!fs.existsSync(sourcePath)) {
        throw new Error(
          `[withAdiRegistration] adi-registration.properties not found at project root: ${sourcePath}\n` +
            `Download it from Google Play Console and place it in your project root.`
        );
      }

      // Create the destination directory if it doesn't exist
      fs.mkdirSync(destDir, { recursive: true });

      // Copy the file
      fs.copyFileSync(sourcePath, destPath);

      console.log(
        `[withAdiRegistration] Copied adi-registration.properties to ${destPath}`
      );

      return config;
    },
  ]);
}

module.exports = withAdiRegistration;
