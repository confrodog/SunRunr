var mongoose = require("mongoose");

mongoose.set('useCreateIndex', true);

mongoose.connect("mongodb://localhost/db19", { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false });

module.exports = mongoose;
