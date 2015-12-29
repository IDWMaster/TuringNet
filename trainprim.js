var brain = require('brain');
var fs = require('fs');


var test = function(net,trainingData) {
    for(var i = 0;i<trainingData.length;i++) {
        if(!((net.run(trainingData[i].input)[0] > .5) == (trainingData[i].output[0]> .5))) {
            
            return false;
        }
    }
    return true;
};

/**
 * Creates a neural network
 * @returns {brain.NeuralNetwork}
 */
var mkemptynet = function(template) {
    var net = new brain.NeuralNetwork({hiddenLayers:[80]});
    //NOTE: Training data is stored in net.trainingData
    /**
     * Sends a note of encouragement to the neural network
     * @param {Number} level A number between 0 and 1, indicating level of enforcement.
     * @returns {undefined}
     */
    net.positiveReinforcement = function(level) {
        var template = net.trainingData[0];
        for(var i = 0;i<template.output.length;i++) {
            if(template.output[i] == 0) {
                template.output[i] = Math.random();
            }else {
            template.output[i]*=(1+level);
            }
        }
        net.trainPattern(template.input,template.output,.5);
    };
    /**
     * Tells the neural network it is heading down the wrong path.
     * @param {Number} level A number between 0 and 1, indicating level of enforcement.
     * @returns {undefined}
     */
    net.negativeReinforcement = function(level) {
        var template = net.trainingData[0];
        for(var i = 0;i<template.output.length;i++) {
            if(template.output[i] == 0) {
                template.output[i] = Math.random();
            }else {
                template.output[i]*=(level);
            }
        }
        net.trainPattern(template.input,template.output,.2);
    };
    return net;
}
//Make a neural-network
var mknet = function(trainingData) {
    var net = mkemptynet();
    net.trainingData = trainingData;
    net.train(trainingData,{errorThresh:.05,iterations:200000,log:true,logPeriod:20,learningRate:.2});
    test(net,trainingData);
    return net;
};
/**
 * Updates weights based on newly available data.
 * @param {brain.NeuralNetwork} net
 * @param {Array} input
 * @param {Array} output
 * @returns {Number}
 */
var trainInput = function(net,input,output) {
  return net.trainPattern(input,output,.2);  
};





var basenet;
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
//basenet.train(table,{errorThresh:.05,iterations:200000,log:true,logPeriod:20,learningRate:.2});
basenet = mknet(table);


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
nets.threshold = mknet(table).toJSON();
//TODO: More complex operations, such as an XOR gate, constructed from AND, OR, and NOT gates
nets.xor = mknet([{input:[0.0,0.0],output:[0.0]}]);
var err = 1;
var cyclesRemain = 500;

while(err>.05) {
    var prevErr = err;
    err = Math.abs(nets.xor.run([0.0,1.0])[0]-1.0)+Math.abs(nets.xor.run([0.0,0.0])[0]-0.0)+Math.abs(nets.xor.run([1.0,1.0])[0]-0.0);
    
    if(err<prevErr) {
        //We've improved
        nets.xor.positiveReinforcement(prevErr-err);
    }else {
        //We haven't improved
        nets.xor.negativeReinforcement(err-prevErr);
    }
    cyclesRemain--;
    if(cyclesRemain == 0) {
         console.log('Current error: '+err);
         cyclesRemain = 50000;
    }
    
}
console.log('Done');
nets.xor = nets.xor.toJSON();




//Output the primitive neural-network to the training file
var output = fs.createWriteStream('binops.json');
output.write(JSON.stringify(nets));
output.end();
