// Official parts-manual URL per machine (the catalog we ingested it from).
// Shown as a "Parts Manual" button on the machine page.
const CF = "https://dz7yasdqa53ew.cloudfront.net/pdf/Parts-Catalogs/English-Parts-Catalogues/";
const D50_60_70 = "https://odense.com.ua/macdon/D50-D60-FD70-Parts-Catalog.pdf";

export const MACHINE_MANUALS = {
  "C-Series":        CF + "C-Series_PC_393322_RevA.pdf",
  "MacDon CA20":     CF + "CA20-PC_169011_RevG.pdf",
  "CA20":            CF + "CA20-PC_169011_RevG.pdf",
  "MacDon CA25":     "https://dz7yasdqa53ew.cloudfront.net/pdf/Parts-Catalogs/CA25-PC_214322_B.pdf",
  "CA25":            "https://dz7yasdqa53ew.cloudfront.net/pdf/Parts-Catalogs/CA25-PC_214322_B.pdf",
  "MacDon D50":      D50_60_70,
  "MacDon D2":       CF + "D2_SP_PC_262675_A.pdf",
  "D2":              CF + "D2_SP_PC_262675_A.pdf",
  "D2 FM200 MacDon": CF + "D2_SP_PC_262675_A.pdf",
  "MacDon D60":      D50_60_70,
  "D60":             D50_60_70,
  "MacDon D65":      CF + "D65-PC-214318_RevC.pdf",
  "D65":             CF + "D65-PC-214318_RevC.pdf",
  "MacDon FD2":      CF + "FD2_FM200_PC_262654_RevB_Case_MD.pdf",
  "FD2":             CF + "FD2_FM200_PC_262654_RevB_Case_MD.pdf",
  "FD2 FM200 MacDon":CF + "FD2_FM200_PC_262654_RevB_Case_MD.pdf",
  "MacDon FD70 FlexDraper Header": D50_60_70,
  "FD70":            D50_60_70,
  "MacDon FD75":     CF + "FD75-PC_214324_C.pdf",
  "FD75":            CF + "FD75-PC_214324_C.pdf",
  "FC":              CF + "FC_PC_393563_RevA.pdf",
  "FC FlexCorn":     CF + "FC_PC_393202_RevA.pdf",
  "MacDon M1170NT":  CF + "M1170NT_M1170NT5_PC_215984_RevB.pdf",
  "M1170NT":         CF + "M1170NT_M1170NT5_PC_215984_RevB.pdf",
  "MacDon M1240":    CF + "M1240_PC_215950_RevB.pdf",
  "M1240":           CF + "M1240_PC_215950_RevB.pdf",
  "MacDon M155":     CF + "M155-PC_262948_RevA.pdf",
  "M155":            CF + "M155-PC_262948_RevA.pdf",
  "MacDon M155E4":   CF + "M155E4_PC_262106_A.pdf",
  "M155E4":          CF + "M155E4_PC_262106_A.pdf",
  "MacDon M205":     CF + "M205-PC_214604_RevB.pdf",
  "M205":            CF + "M205-PC_214604_RevB.pdf",
  "MacDon M2170":    CF + "M2170_M2170NT-PC_262666_RevA.pdf",
  "M2170":           CF + "M2170_M2170NT-PC_262666_RevA.pdf",
  "MacDon M2260":    CF + "M2260_PC_393099_RevB.pdf",
  "M2260":           CF + "M2260_PC_393099_RevB.pdf",
  "MacDon PW8":      CF + "PW8_PC_262859_A.pdf",
  "PW8":             CF + "PW8_PC_262859_A.pdf",
  "MacDon R113 R116":CF + "R113_R116_SP_PC_393128_A.pdf",
  "R113 R116":       CF + "R113_R116_SP_PC_393128_A.pdf",
  "R113 R116 FR":    CF + "R113_R116_SP_PC_393128_A.pdf",
  "R113 R116 PT":    CF + "R113_R116_SP_PC_393128_A.pdf",
  "MacDon R216":     CF + "R216_SP_PC_393103_RevC.pdf",
  "R216":            CF + "R216_SP_PC_393103_RevC.pdf",
  "TR S":            CF + "TR_S_PC_262954_RevB.pdf",
  "TR25":            CF + "TR25_PC_262892_RevA.pdf",
  "Degelman Signature 6000/7200 Rock Picker": "https://degelman.com/pub/resources/manuals/rock-removal/rock-pickers/signature-60007200/operatorsparts/sn-rp26774-and-above/143478-RockPicker.pdf",
};

// Combine makes in our catalog are all Redekop-fitment machines → point their
// manual button at Redekop's manuals, filtered to that model.
const COMBINE_MAKES = ["AGCO", "John Deere", "Case IH", "CaseIH", "New Holland", "CLAAS Lexion", "CLAAS", "Gleaner", "Massey Ferguson", "Fendt", "Versatile"];

export const manualFor = (machineName, make, model) => {
  const directKeys = [
    machineName,
    model,
    [make, model].filter(Boolean).join(" ").trim(),
  ].filter(Boolean);
  for (const key of directKeys) {
    if (MACHINE_MANUALS[key]) return MACHINE_MANUALS[key];
  }
  if (make && model && COMBINE_MAKES.includes(make)) {
    return "https://redekopmfg.com/support/manuals/?_sfm_model_number=" + encodeURIComponent(model);
  }
  return null;
};
