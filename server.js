const {readFileSync} = require("fs")
const {join} = require("path")
const {createServer} = require("https")

const express = require("express")
const Corrosion = require("corrosion")

module.exports = config => {
    const blacklist = ({url, clientResponse: res}) => {
        if (config.blacklist.includes(url.hostname)) {
            res.redirect(308, "/blacklisted")
        }
    }

    const corrosion = new Corrosion({
        codec: "xor",
        prefix: "/main/",
        title: "Forage",
        requestMiddleware: [blacklist],
        ...config.corrosion
    })

    const app = express()

    const server = createServer({
        key: readFileSync(join(__dirname, "dummy.key")),
        cert: readFileSync(join(__dirname, "dummy.cert"))
    }, app)

    app.get("/gateway", (req, res) => {
        let givenUrl = req.query.url

        // Stolen from Corrosion :P
        if (!givenUrl) {
            res.statusCode = 400
            res.end("Forage gateway requires URL query string parameter.")
            return
        }

        const urlRegex = /https?:\/\/([a-zA-Z0-9\-\_])|([a-zA-Z0-9\-\_])\.([a-zA-Z])/
        if (urlRegex.test(givenUrl)) {
            if (!/^https?:\/\//.test(givenUrl)) {
                givenUrl = "http://" + givenUrl
            }
        } else {
            givenUrl = "https://google.com/search?q=" + givenUrl
        }

        urlObject = new URL(givenUrl)

        if (urlObject.hostname in config.redirects) {
            const hostnameRedirects = config.redirects[urlObject.hostname]
            if (urlObject.pathname in hostnameRedirects) {
                urlObject.pathname = hostnameRedirects[urlObject.pathname]
            }
        }

        let targetUrl
        if (config.womginx.includes(urlObject.hostname)) {
            targetUrl = "/wgnx/" + urlObject
        } else {
            targetUrl = corrosion.url.wrap(urlObject.toString())
        }

        res.writeHead(308, {Location: targetUrl})
        res.end("Forage is redirecting you to your desired page...")
    })

    app.all("/main/*", (req, res) => {
        corrosion.request(req, res)
    })

    server.on("upgrade", (req, conn, head) => {
        corrosion.upgrade(req, conn, head)
    })

    return server
}
