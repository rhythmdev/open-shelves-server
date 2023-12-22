const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.send('Open Shelves Server Is Running')
})
app.listen(port, () => {
    console.log(`Open Shelves Server Is Running On Port ${port}`);
})