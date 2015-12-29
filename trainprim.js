var brain = require('brain');
var fs = require('fs');
var basenet = new brain.NeuralNetwork({hiddenLayers:[80]}); //Base neural-network, for executing Turing instructions
//OPCODE list: .0 -- AND, .4 -- OR, .9 -- NOT
//This set of operations should be turing-complete. In other words; we should be able to express
//all operations of a hypothetical turing machine using these instructions

//Train the basenet on truth tables for each OPCODE
var table = [
    //AND
    {input:[0,0,0],output:[0]},
    {input:[0,1,0],output:[0]},
    {input:[0,1,1],output:[1]},
    {input:[0,0,1],output:[0]},
    //OR
    {input:[.4,0,0],output:[0]},
    {input:[.4,1,0],output:[1]},
    {input:[.4,1,1],output:[1]},
    {input:[.4,0,1],output:[1]},
    //NOT
    {input:[.9,0,0],output:[1]},
    {input:[.9,1,0],output:[0]},
    {input:[.9,1,1],output:[0]},
    {input:[.9,0,1],output:[1]},
    
];
basenet.train(table,{errorThresh:.05,iterations:200000,log:true,logPeriod:20,learningRate:.2});
var test = function(net,trainingData) {
    for(var i = 0;i<trainingData.length;i++) {
        if(!((net.run(trainingData[i].input)[0] > .5) == (trainingData[i].output[0]> .5))) {
            
            return false;
        }
    }
    return true;
};
//Make a neural-network
var mknet = function(trainingData) {
    var net = new brain.NeuralNetwork({hiddenLayers:[80]});
    net.train(trainingData,{errorThresh:.05,iterations:200000,log:true,logPeriod:20,learningRate:.2});
    test(net,trainingData);
    return net;
};

if(!test(basenet,table)) {
    throw 'Training of basenet failed.';
}

var nets = {};
nets.logic = basenet.toJSON();


//Create thresholding neural-network
table = new Array();
var accuracy = 500;
for(var i = 0;i<accuracy;i++) {
    table.push({input:[i/accuracy],output:[((i/accuracy)>.5)*1]});
}
nets.threshold = mknet(table);


//Output the primitive neural-network to the training file
var output = fs.createWriteStream('binops.json');
output.write(JSON.stringify(nets));
output.end();
