const fs = require('fs')
const xml2js = require('xml2js')
const express = require('express')
const redis = require('redis')

const app = express()
const client = redis.createClient({
    host: 'redis-server',
    port: 6379
})
const arguments = process.argv
const parser = new xml2js.Parser()

const setRedisKey = (key, value) => {
    client.set(key, value && JSON.stringify(value))
}

app.get("/export", (req, res) => {
    fs.readFile(__dirname + '/config.xml', (err, data) => {
        parser.parseString(data, (err, jsonData) => {
            const config = jsonData.config.subdomains[0].subdomain
            const output = {}
            setRedisKey("subdomains", config)
            output.subdomains = config

            const cookies = jsonData.config.cookies[0].cookie
            for (let key in cookies) {
                const redisKey = `cookie:${cookies[key]["$"].name}:${cookies[key]["$"].host}`
                const redisVal = cookies[key]["_"]
                setRedisKey(redisKey, redisVal)
                output[redisKey] = redisVal
            }
            return res.send(output)
        })
    })
})

app.listen(8080)