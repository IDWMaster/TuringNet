var brain = require('brainjs');
var fs = require('fs');
var basenet = new brain.NeuralNetwork({hiddenLayers:[80]}); //Base neural-network, for executing Turing instructions
//OPCODE list: .0 -- AND, .4 -- OR, .9 -- NOT
//This set of operations should be turing-complete. In other words; we should be able to express
//all operations of a hypothetical turing machine using these instructions

//Make a neural-network
var mknet = function(trainingData) {
    var net = new brain.NeuralNetwork({hiddenLayers:[80]});
    net.train(trainingData,{errorThresh:.05,iterations:200000,log:true,logPeriod:20,learningRate:.2});
    
    return net;
};
var mknetFromFunctionSync = function(trainingSample,inputs,func) {
    var net = new brain.NeuralNetwork({hiddenLayers:[80]});
    net.train(trainingSample,{errorThresh:.05,iterations:1,learningRate:.2,log:false});
    var threshold = .05;
    var err = 1;
    while(err>.05) {
        err = 0;
        for(var i = 0;i<inputs.length;i++) {
            var input = inputs[i];
            err+=net.trainFunction(input,function(output){
                return func(input,output);
            },.2);
        }
        console.log('Current error: '+err);
        //err/=inputs.length;
    }
    return net;
};
//TODO: Test NEW method
var inputs = new Array();
var addOpCode = function(opcode) {
    inputs.push([opcode,0,0],[opcode,0,1],[opcode,1,0],[opcode,1,1]);
};
addOpCode(0);
addOpCode(.4);
addOpCode(.9);
basenet = mknetFromFunctionSync({input:[0,0,0],output:[0]},inputs,function(input,output){
    switch(input[0]) {
        case 0:
            return [(input[1] & input[2])-output[0]];
            break;
        case .4:
            return [(input[1] | input[2])-output[0]];
            break;
        case .9:
            return [(!input[1])-output[0]];
            break;
        default:
            throw 'sideways';
    }
});
for(var i = 0;i<inputs.length;i++) {
    input = inputs[i];
    console.log('OP '+input[0]+': '+input[1]+','+input[2]+' == '+(basenet.run(input) > .5)*1);
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


//Output the primitive neural-network to the training file
var output = fs.createWriteStream('binops.json');
output.write(JSON.stringify(nets));
output.end();
