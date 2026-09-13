const AdmZip = require("adm-zip");
const fs = require("fs");

const INPUT = "DISPOSISI_TEMPLATE.docx";
const OUTPUT = "template_FIXED_SAFE.docx";

const zip = new AdmZip(INPUT);
let xml = zip.readAsText("word/document.xml");

xml = xml.replace(
  /<w:p[\s\S]*?<\/w:p>/g,
  paragraph => {
    const texts = [];
    const runs = [];

    paragraph.replace(/<w:r[\s\S]*?<\/w:r>/g, run => {
      runs.push(run);
      const match = run.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/);
      if (match) texts.push(match[1]);
    });

    if (texts.length <= 1) return paragraph;

    const mergedText = texts
      .join("")
      .replace(/{{\s+/g, "{{")
      .replace(/\s+}}/g, "}}");

    // replace ONLY first <w:t>, remove the rest
    let replaced = false;
    const newRuns = runs.map(run => {
      if (!replaced && run.includes("<w:t")) {
        replaced = true;
        return run.replace(
          /<w:t[^>]*>[\s\S]*?<\/w:t>/,
          `<w:t xml:space="preserve">${mergedText}</w:t>`
        );
      }
      return run.replace(/<w:t[^>]*>[\s\S]*?<\/w:t>/, "");
    });

    return paragraph.replace(
      /<w:r[\s\S]*?<\/w:r>/g,
      () => newRuns.shift()
    );
  }
);

zip.updateFile("word/document.xml", Buffer.from(xml, "utf8"));
zip.writeZip(OUTPUT);

console.log("✅ TEMPLATE FIX SAFE SELESAI");
console.log("📄 OUTPUT:", OUTPUT);
