import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("IdentityRegistryModule", (m) => {
  let eevm = "0x9902984d86059234c3B6e11D5eAEC55f9627dD0f";

  const identityRegistry = m.contract("IdentityRegistry", [eevm]);

  return { identityRegistry };
});