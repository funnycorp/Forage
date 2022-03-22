const {
    rmdirSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    writeFileSync,
    copyFileSync
} = require("fs")
const {join} = require("path")

const {renderFile} = require("pug")
const {compile} = require("handlebars")

const viewsBase = join(__dirname, "views")
const assetsBase = join(__dirname, "assets")
const confBase = join(__dirname, "conf")
const wombatBase = join(__dirname, "node_modules", "@webrecorder", "wombat", "dist")
const outputBase = join(__dirname, "output")
const generatedConfBase = join(__dirname, "generated-conf")

module.exports = context => {
    // Of course, Node 12 doesn't have rmSync(..., {force: true, recursive: true})
    console.log("Cleaning previous files...")
    rmdirSync(outputBase, {recursive: true})
    rmdirSync(generatedConfBase, {recursive: true})
    mkdirSync(outputBase, {recursive: true})
    mkdirSync(generatedConfBase, {recursive: true})

    console.log("Preparing assets and templates...")
    const views = readdirSync(viewsBase)
    const assets = readdirSync(assetsBase)
    const conf = readdirSync(confBase)

    for (const entry of views) {
        if (entry.startsWith("_") || !entry.endsWith(".pug"))
            continue
        
        const output = renderFile(join(viewsBase, entry), {basedir: viewsBase, ...context})
        writeFileSync(join(outputBase, entry.replace(/\.pug$/, ".html")), output)

        console.log("Processed view", entry)
    }

    for (const entry of assets) {
        copyFileSync(join(assetsBase, entry), join(outputBase, entry))
        console.log("Copied asset", entry)
    }

    for (const entry of conf) {
        if (entry.startsWith("_") || !entry.endsWith(".hbs"))
            continue
        
        const input = readFileSync(join(confBase, entry), "utf-8")
        const output = compile(input)(context)
        writeFileSync(join(generatedConfBase, entry.slice(0, -4)), output)

        console.log("Processed configuration", entry)
    }

    copyFileSync(join(wombatBase, "wombat.js"), join(outputBase, "wombat.js"))
    copyFileSync(join(wombatBase, "wombatWorkers.js"), join(outputBase, "wombatWorkers.js"))
    console.log("Copied Wombat scripts")
}