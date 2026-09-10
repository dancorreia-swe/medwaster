const fs = require("fs");
const path = require("path");

const { withDangerousMod } = require("expo/config-plugins");

const MARKER = "with-ios-deployment-target";

const POST_INSTALL_PATCH = `
    # Added by ${MARKER}: Xcode 27 rejects deployment targets below iOS 15, and pods
    # such as SDWebImage or the generated resource bundles keep their podspec minimum.
    minimum_deployment_target = podfile_properties['ios.deploymentTarget'] || '15.1'
    installer.pods_project.targets.each do |pod_target|
      pod_target.build_configurations.each do |pod_config|
        current = pod_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        next if current.is_a?(String) && current =~ /\\A\\d+(\\.\\d+)*\\z/ &&
          Gem::Version.new(current) >= Gem::Version.new(minimum_deployment_target)
        pod_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = minimum_deployment_target
      end
    end
`;

function patchPodfile(contents) {
  if (contents.includes(MARKER)) {
    return contents;
  }

  const reactNativePostInstall = /react_native_post_install\([\s\S]*?\n {4}\)\n/;
  if (!reactNativePostInstall.test(contents)) {
    throw new Error(`${MARKER} could not find the react_native_post_install call in the Podfile`);
  }

  return contents.replace(
    reactNativePostInstall,
    (match) => `${match}${POST_INSTALL_PATCH}`
  );
}

module.exports = function withIosDeploymentTarget(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const podfile = path.join(config.modRequest.platformProjectRoot, "Podfile");
      fs.writeFileSync(podfile, patchPodfile(fs.readFileSync(podfile, "utf8")));
      return config;
    },
  ]);
};

module.exports.patchPodfile = patchPodfile;
