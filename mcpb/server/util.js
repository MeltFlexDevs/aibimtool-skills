import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
// Results go to disk and the tools return the path, not the bytes: an IFC is
// megabytes, and a coding agent usually only hands it to the next step.
export const OUTPUT_DIR = "aibimtool-output";
const stamp = () => new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);
const slug = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 40) || "model";
/** Where a result is written: `outputPath` as a file or a folder, else ./aibimtool-output/. */
export function outputFile(title, ext, outputPath) {
    let path;
    if (outputPath && extname(outputPath))
        path = resolve(outputPath);
    else
        path = join(resolve(outputPath ?? OUTPUT_DIR), `${slug(title)}-${stamp()}.${ext}`);
    mkdirSync(dirname(path), { recursive: true });
    return path;
}
export function writeOutput(bytes, title, ext, outputPath) {
    const path = outputFile(title, ext, outputPath);
    writeFileSync(path, bytes);
    return path;
}
/** A project's status as a person or an agent reads it: state and next step first, then the facts. */
export function describe(p) {
    const lines = [`Project "${p.title}" (${p.id}): ${p.state}. ${p.next}`];
    if (p.reply)
        lines.push("", "The AIBIMTool agent said:", p.reply);
    if (p.questions?.length) {
        lines.push("", "Questions:");
        p.questions.forEach((q, i) => {
            lines.push(`${i + 1}. ${q.header}: ${q.question}`);
            for (const o of q.options)
                lines.push(`   - ${o.label}${o.description ? `: ${o.description}` : ""}`);
        });
    }
    if (p.plan?.length)
        lines.push("", "Plan:", ...p.plan.map((t) => `#${t.id} [${t.status}] ${t.subject}`));
    if (p.error)
        lines.push("", `Error: ${p.error}`);
    lines.push("", `Elements: ${p.elements} · credits used by the latest message: ${p.creditsUsed}`, `Viewer: ${p.viewerUrl}`);
    return lines.join("\n");
}
