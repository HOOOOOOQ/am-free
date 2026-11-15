const app = require('./app')

const PORT = process.env.PORT || 3300

app.listen(PORT, '0.0.0.0', () => {
  console.log(`pall/am — server jalan di http://localhost:${PORT}`)
})
