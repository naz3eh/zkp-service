import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("ValidationRegistryModule", (m) => {
  let eevm = "0x9902984d86059234c3B6e11D5eAEC55f9627dD0f";
  let identityRegistry = "0xBee221aE6cA5a6ad40F339990A8bE89864Cdd589"

  const validationRegistry = m.contract("ValidationRegistry", [identityRegistry, eevm]);

  return { validationRegistry };
});