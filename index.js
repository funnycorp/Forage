#!/usr/bin/env node

const {existsSync, unlinkSync, chmodSync} = require("fs")

const createServer = require("./server")
const prepare = require("./prepare")
const config = require("./config")
const domains = require("./domains")

// Bitnami's stupid Node 12 doesn't support ??= or ||=

// config.womginx ??= []
// config.redirects ??= {}
// config.blacklist ??= []

if (!config.womginx)
    config.womginx = []

if (!config.redirects)
    config.redirects = {}

if (!config.blacklist)
    config.blacklist = []

const context = {
    config,
    domains,
    root: __dirname
}

prepare(context)

console.log("Starting Corrosion gateway...")

const server = createServer(config)

const socketPath = "/tmp/corrosion.socket"

const unlinkForce = () => {
    if (existsSync(socketPath))
        unlinkSync(socketPath)
}

unlinkForce()

process
    .on("SIGINT", () => {
        console.log("\nStopping the Corrosion gateway...")
        unlinkForce()
        process.exit()
    })
    .on("uncaughtExceptionMonitor", () => {
        console.log("\nStopping from an uncaught exception!")
        unlinkForce()
        process.exit(1)
    })

server.listen(socketPath)
chmodSync(socketPath, "777")

console.log("Corrosion gateway has started!")
