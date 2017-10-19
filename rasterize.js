/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
const WIN_Z = 0;  // default graphics window z coord in world space
const WIN_LEFT = 0; const WIN_RIGHT = 1;  // default left and right x coords in world space
const WIN_BOTTOM = 0; const WIN_TOP = 1;  // default top and bottom y coords in world space
//const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog2/triangles.json"; // triangles file loc
//const INPUT_SPHERES_URL = "https://ncsucgclass.github.io/prog2/ellipsoids.json"; // ellipsoids file loc

const INPUT_ELLIPSOIDS_URL = "https://ncsucgclass.github.io/prog2/ellipsoids.json"
const INPUT_TRIANGLES_URL  ="https://demo2448912.mockable.io"
// default eye position in world space

/* webgl globals */
var gl = null; // the all powerful gl object. It's all here folks!

var vertexBuffer = []; // this contains vertex coordinates in triples
var triangleBuffer = []; // this contains indices into vertexBuffer in triples
var normalBuffer = [];

var colorBuffer_a;
var colorBuffer_d;
var colorBuffer_s;

var shapeIndex = 0;
var noOfShapes = 0;
var triangleIndices = [];
var ellipsoidIndices = [];
var shapeProperties = [];
var currentHighlightedObject = -1;

 // color buffer contains r g b a for each fragments
var triBufferSize = []; // the number of indices in the triangle buffer
var vertexPositionAttrib; // where to put position for vertex shader

var vertexColorAttrib_a;
var vertexColorAttrib_d;
var vertexColorAttrib_s;

var vertexNormalAttrib;

var specularIndex;
var model_matrix_uniform;
var perspective_matrix_uniform;

var shaderProgram ;

var mvMatrix=[];
var pMatrix=[];


var eyePos = [0.5,0.5,-0.5];
var lookUpVals = [0,1,0];
var lookAtVals = [0.5,0.5,0];

var globals = {

array4buffers : {
    coordArray : [] ,
    normalArray : [],
    indexArray : []
},

ellipsoids : {
    latitudeBands : 50,
    longitudeBands : 50
}


};

var highlightTriangleIndex=0;
var highlightEllipsoidIndex=0;



// ASSIGNMENT HELPER FUNCTIONS

// get the JSON file from the passed URL
function getJSONFile(url,descr) {
    try {
        if ((typeof(url) !== "string") || (typeof(descr) !== "string"))
            throw "getJSONFile: parameter not a string";
        else {
            var httpReq = new XMLHttpRequest(); // a new http request
            httpReq.open("GET",url,false); // init the request
            httpReq.send(null); // send the request
            var startTime = Date.now();
            while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
                if ((Date.now()-startTime) > 3000)
                    break;
            } // until its loaded or we time out after three seconds
            if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE))
                throw "Unable to open "+descr+" file!";
            else
                return JSON.parse(httpReq.response); 
        } // end if good params
    } // end try    
    
    catch(e) {
        console.log(e);
        return(String.null);
    }
} // end get json file



// set up the webGL environment
function setupWebGL() {

    // Get the canvas and context
    var canvas = document.getElementById("myWebGLCanvas"); // create a js canvas
    gl = canvas.getContext("webgl"); // get a webgl object from it
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    
    try {
      if (gl == null) {
        throw "unable to create gl context -- is your browser gl ready?";
      } else {
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
        gl.clearDepth(1.0); // use max when we clear the depth buffer
        gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
      }
    } // end try
    
    catch(e) {
      console.log(e);
    } // end catch
 
} // end setupWebGL






// setup the webGL shaders
function setupShaders() {
    
    // define fragment shader in essl using es6 template strings
    var fShaderCode = `
        precision highp float;

        uniform vec4 aVertexColor_diffuse;
        uniform vec4 aVertexColor_ambient;
        uniform vec4 aVertexColor_specular;
        uniform float spec_value;
        
         vec3 lightPos = vec3(-1.0,3.0,-0.5);
         vec4 ambientColor = vec4(1.0, 1.0, 1.0, 1.0);
         vec4 diffuseColor = vec4(1.0, 1.0, 1.0,1.0);
         vec4 specColor = vec4(1.0, 1.0, 1.0,1.0);
         vec3 eye = vec3(0.5,0.5,-0.5);
         int mode = 2;
        
         float specular = 0.0;


        varying vec3 normal;
        varying vec4 vertex;

        vec4 tempColor;

        vec3 vertextemp;

        void main(void) {

            vertextemp = vertex.xyz;
               // code for bling phong model
            vec3 viewDir = normalize(eye - vertextemp);
            vec3 lightDir = normalize(lightPos - vertextemp);
            float lambertian = max(dot(lightDir,normal), 0.0); // LdoN

             if(lambertian > 0.0)
            {             
                vec3 halfDir = normalize(lightDir + viewDir);
                float specAngle = max(dot(halfDir, normal), 0.0); // HdotN
                specular = pow(specAngle, spec_value);

                if(mode == 2) {
                    vec3 reflectDir = reflect(-lightDir, normal);
                    specAngle = max(dot(reflectDir, viewDir), 0.0);
                    // note that the exponent is different here
                    specular = pow(specAngle, spec_value);
                }

             }          

            gl_FragColor= (ambientColor * aVertexColor_ambient )+ (diffuseColor * aVertexColor_diffuse * lambertian )+ (specColor * aVertexColor_specular * specular) ;
  
       

        }
    `;
    
    // define vertex shader in essl using es6 template strings
    var vShaderCode = `
        attribute vec3 vertexPosition;
        attribute vec3 normalfPosition;

        varying vec3 normal; // for passing info to fshader
        varying vec4 vertex;// for passing info to fshader

        uniform mat4 mvmatrix; // the one whole solution for representing the positions
        uniform mat4 pmatrix;


        void main(void) {
            vertex = pmatrix * mvmatrix * vec4(vertexPosition.xyz,1.0) ;
            gl_Position = vertex; // use the untransformed position
            normal = normalfPosition;
           
                    }
    `;
    
    try {
        // console.log("fragment shader: "+fShaderCode);
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader,fShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        // console.log("vertex shader: "+vShaderCode);
        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader,vShaderCode); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution
            
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);  
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);  
            gl.deleteShader(vShader);
        } else { // no compile errors
           console.log("no compile errors")
            shaderProgram = gl.createProgram(); // create the single shader program
            gl.attachShader(shaderProgram, fShader); // put frag shader in program
            gl.attachShader(shaderProgram, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram); // link program into gl context
            

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
            } else { // no shader program link errors
               
                gl.useProgram(shaderProgram); // activate shader program (frag and vert)
               
                vertexPositionAttrib = gl.getAttribLocation(shaderProgram, "vertexPosition"); // get pointer to vertex shader input
                gl.enableVertexAttribArray(vertexPositionAttrib); 


                // colors
                vertexColorAttrib_a = gl.getUniformLocation(shaderProgram,"aVertexColor_ambient")


                vertexColorAttrib_d =  gl.getUniformLocation(shaderProgram,"aVertexColor_diffuse")


                vertexColorAttrib_s = gl.getUniformLocation(shaderProgram,"aVertexColor_specular")

                //normal


                vertexNormalAttrib = gl.getAttribLocation(shaderProgram, "normalfPosition"); // get pointer to vertex color input
                gl.enableVertexAttribArray(vertexNormalAttrib); 

                  // specular reflection
                specularIndex = gl.getUniformLocation(shaderProgram,"spec_value")
                model_matrix_uniform = gl.getUniformLocation(shaderProgram,"mvmatrix")
                perspective_matrix_uniform = gl.getUniformLocation(shaderProgram,"pmatrix")

                // input to shader from array
            } // end if no shader program link errors
        } // end if no compile errors

    // clearing the buffers before use
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers

    } // end try 
    
    catch(e) {
        console.log("in here");
        console.log(e);
    } // end catch
} // end setup shaders


/*function normalizeVector(x,y,z)
{
    var mag = sq(x)+sq(y)+sq(z)
    mag = Math.sqrt(mag)
    return [x/mag,y/mag,z/mag];

}*/


function loadShapes(desc = ""){
        var inputEllipsoids = getJSONFile(INPUT_ELLIPSOIDS_URL,"ellipsoids");
        var inputTriangles = getJSONFile(INPUT_TRIANGLES_URL,"triangles");

         


       // console.log(JSON.stringify(inputEllipsoids))
      if (inputEllipsoids != String.null && inputTriangles != String.null) { 

       /*******************************************************************/

        // Ellipsoids
        if(desc == "ellipsoids" || desc == "") 
        for (var epllipsoidIndex=0; epllipsoidIndex<inputEllipsoids.length; epllipsoidIndex++) {
            clearCache();


            //adding the per
           


            var vtxToAdd = []; // vtx coords to add to the coord array
            var normalToAdd = [];

            var indexOffset = vec3.create(); // the index offset for the current set
            var triToAdd = vec3.create(); // tri indices to add to the index array

            triBufferSize[shapeIndex] = 0;
        
            vec3.set(indexOffset,0,0,0); // update vertex offset
            
            var currentEllipsoid = inputEllipsoids[epllipsoidIndex];

            //setting up Ellipsoid Vertices
            currentEllipsoid.vertices = [];
            currentEllipsoid.triangles = [];
            currentEllipsoid.normals = [];

            console.log("Shape index",shapeIndex," spec :",currentEllipsoid.n)
           


            var ambient_color_array = [currentEllipsoid.ambient[0],currentEllipsoid.ambient[1],currentEllipsoid.ambient[2],1] ;
            var diffuse_color_array = [currentEllipsoid.diffuse[0],currentEllipsoid.diffuse[1],currentEllipsoid.diffuse[2],1] ;
            var specular_color_array = [currentEllipsoid.specular[0],currentEllipsoid.specular[1],currentEllipsoid.specular[2],1] ; 



             var property = {
                ambient : ambient_color_array,
                diffuse : diffuse_color_array,
                specular : specular_color_array,
                n : currentEllipsoid.n,
                center : [currentEllipsoid.x,currentEllipsoid.y,currentEllipsoid.z]

             }

            shapeProperties[shapeIndex] = property;
           

            

               
            for (var latNumber = 0; latNumber <= globals.ellipsoids.latitudeBands; latNumber++) {
                var theta = latNumber * Math.PI / globals.ellipsoids.latitudeBands;
                var sinTheta = Math.sin(theta);
                var cosTheta = Math.cos(theta);

                for (var longNumber = 0; longNumber <= globals.ellipsoids.longitudeBands; longNumber++) {
                    var vertex = [];
                    var normal = [];

                    var phi = longNumber * 2 * Math.PI / globals.ellipsoids.longitudeBands;
                    var sinPhi = Math.sin(phi);
                    var cosPhi = Math.cos(phi);

                    //with unit radius (sphere)    
                    var x = (cosPhi * sinTheta) ;
                    var y = (cosTheta) ;
                    var z = sinPhi * sinTheta;

                    var u = 1 - (longNumber / globals.ellipsoids.longitudeBands);
                    var v = 1 - (latNumber / globals.ellipsoids.longitudeBands);


                    x = (currentEllipsoid.a * x) + currentEllipsoid.x;
                    y = (currentEllipsoid.b * y) + currentEllipsoid.y
                    z = (currentEllipsoid.c * z) + currentEllipsoid.z;

                    var x3 = currentEllipsoid.x; var a = currentEllipsoid.a;
                    var y3 = currentEllipsoid.y; var b = currentEllipsoid.b;
                    var z3 = currentEllipsoid.z; var c = currentEllipsoid.c;

                    var normalArrayTemp = [2*sq(b*c)*(x-x3), 2*sq(a*c)*(y-y3), 2*sq(b*a)*(z-z3)];
                    
                    var normal_temp = vec3.fromValues(2*sq(b*c)*(x-x3), 2*sq(a*c)*(y-y3), 2*sq(b*a)*(z-z3));
                    
                    vec3.normalize(normal_temp,normal_temp)
           
                    normal.push(normal_temp[0]);
                    normal.push(normal_temp[1]);
                    normal.push(normal_temp[2]);


                    vertex.push(x);
                    vertex.push(y);
                    vertex.push(z);


                    currentEllipsoid.vertices.push(vertex);
                    currentEllipsoid.normals.push(normal);

                }
            } // end of latitude for loop


            // indices or triangles

                for (var latNumber = 0; latNumber < globals.ellipsoids.latitudeBands; latNumber++) {
                    for (var longNumber = 0; longNumber < globals.ellipsoids.longitudeBands; longNumber++) {
                        var index = [];
                        var first = (latNumber * (globals.ellipsoids.longitudeBands + 1)) + longNumber;
                        var second = first + globals.ellipsoids.longitudeBands + 1;
                        index.push(first);
                        index.push(second);
                        index.push(first + 1);
                        currentEllipsoid.triangles.push(index);

                        index = [];
                        index.push(second);
                        index.push(second + 1);
                        index.push(first + 1);
                        currentEllipsoid.triangles.push(index);
                    }
                }


            for (var normalIndex = 0; normalIndex <  currentEllipsoid.normals.length ; normalIndex++) {

                normalToAdd = currentEllipsoid.normals[normalIndex];
                globals.array4buffers.normalArray.push(normalToAdd[0],normalToAdd[1],normalToAdd[2])
            }

            //   same logic as for triangle
            for (var whichSetVert=0; whichSetVert < currentEllipsoid.vertices.length; whichSetVert++) {
                vtxToAdd = currentEllipsoid.vertices[whichSetVert];
                globals.array4buffers.coordArray.push(vtxToAdd[0],vtxToAdd[1],vtxToAdd[2]);

         
                
            } // end for vertices in set
               
               console.log("no of triangle vertex  groups : "+globals.array4buffers.coordArray.length / 3) 
              
                
            // set up the triangle index array, adjusting indices across sets
            for ( var whichSetTri=0; whichSetTri < currentEllipsoid.triangles.length; whichSetTri++) {
                vec3.add(triToAdd,indexOffset,currentEllipsoid.triangles[whichSetTri]);
                globals.array4buffers.indexArray.push(triToAdd[0],triToAdd[1],triToAdd[2]);
            } // end for triangles in set

            triBufferSize[shapeIndex] += currentEllipsoid.triangles.length; // total number of tris

             triBufferSize[shapeIndex] *= 3;
            console.log("shapeIndex : "+shapeIndex)
           
            settingBuffers(shapeIndex);
            renderShape(shapeIndex);
            ellipsoidIndices.push(shapeIndex);
            shapeIndex+=1;



        } // end for each Ellipsoid set 


    


        /*******************************************************************/



        //Triangles 

        if(desc == "triangles" ||desc == "" ) 
        for (var whichSet=0; whichSet<inputTriangles.length; whichSet++) {
            clearCache();
         
            var vtxToAdd = []; // vtx coords to add to the coord array
            var normalToAdd = [];

            var indexOffset = vec3.create(); // the index offset for the current set
            var triToAdd = vec3.create(); // tri indices to add to the index array
            triBufferSize[shapeIndex] = 0

            /////////////////

            vec3.set(indexOffset,0,0,0); // update vertex offset
            
            var currentTriangle = inputTriangles[whichSet];

            var diffuse_color = currentTriangle.material.diffuse;
            var ambient_color = currentTriangle.material.ambient;
            var specular_color = currentTriangle.material.specular;

  
            var ambient_color_array = [ambient_color[0],ambient_color[1],ambient_color[2],1] ;
            var diffuse_color_array = [diffuse_color[0],diffuse_color[1],diffuse_color[2],1] ;
            var specular_color_array = [specular_color[0],specular_color[1],specular_color[2],1] ; 

            var centerx = (currentTriangle.vertices[0][0] + currentTriangle.vertices[1][0] + currentTriangle.vertices[2][0] ) /3;
            var centery = (currentTriangle.vertices[0][1] + currentTriangle.vertices[1][1] + currentTriangle.vertices[2][1] ) /3;
            var centerz = (currentTriangle.vertices[0][2] + currentTriangle.vertices[1][2] + currentTriangle.vertices[2][2] ) /3;


             var property = {
                ambient : ambient_color_array,
                diffuse : diffuse_color_array,
                specular : specular_color_array,
                n : currentTriangle.material.n,
                center : [centerx,centery,centerz]

             }

            shapeProperties[shapeIndex] = property;

            for (var normalIndex = 0; normalIndex <  currentTriangle.normals.length ; normalIndex++) {

                normalToAdd = currentTriangle.normals[normalIndex];
                globals.array4buffers.normalArray .push(normalToAdd[0],normalToAdd[1],normalToAdd[2])
            }


            // set up the vertex coord array
            for (var whichSetVert=0; whichSetVert < currentTriangle.vertices.length; whichSetVert++) {
                vtxToAdd = currentTriangle.vertices[whichSetVert];
                globals.array4buffers.coordArray.push(vtxToAdd[0],vtxToAdd[1],vtxToAdd[2]);
                              
            } // end for vertices in set
            
            // set up the triangle index array, adjusting indices across sets
            for (var whichSetTri=0; whichSetTri < currentTriangle.triangles.length; whichSetTri++) {
                vec3.add(triToAdd,indexOffset,currentTriangle.triangles[whichSetTri]);
                globals.array4buffers.indexArray.push(triToAdd[0],triToAdd[1],triToAdd[2]);
            } // end for triangles in set

            triBufferSize[shapeIndex] += currentTriangle.triangles.length; // total number of tris
            ////////////////////////////////////////////////////////////////////////////////////


          triBufferSize[shapeIndex] *= 3; // now total number of indices
       
           
         settingBuffers(shapeIndex)
         renderShape(shapeIndex);
         triangleIndices.push(shapeIndex);
         shapeIndex+=1;
        }  // end of trianlgles
        console.log("no of shapes ",shapeIndex)

        noOfShapes = shapeIndex;



        

      }
     

} 






function settingBuffers(index){

     // send the vertex coords to webGL
       

    vertexBuffer[index] = gl.createBuffer(); // init empty vertex coord buffer
    gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer[index]); // activate that buffer
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(globals.array4buffers.coordArray),gl.STATIC_DRAW); // coords to that buffer
    
   
    normalBuffer[index] = gl.createBuffer(); // init empty vertex coord buffer
    gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffer[index]); // activate that buffer
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(globals.array4buffers.normalArray),gl.STATIC_DRAW); // coords to that buffer
    

  
    // send the triangle indices to webGL
    triangleBuffer[index] = gl.createBuffer(); // init empty triangle index buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer[index]); // activate that buffer
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(globals.array4buffers.indexArray),gl.STATIC_DRAW); // indices to that buffer


}

// render the loaded model
function renderShape(index) {

    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers

    // vertex buffer: activate and feed into vertex shader
    gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer[index]); // activate
    gl.vertexAttribPointer(vertexPositionAttrib,3,gl.FLOAT,false,0,0); // feed

 
    gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffer[index]); // activate
    gl.vertexAttribPointer(vertexNormalAttrib,3,gl.FLOAT,false,0,0); // feed


    // triangle buffer: activate and render
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer[index]); // activate

    setUniformMatrices(index);
    gl.drawElements(gl.TRIANGLES,triBufferSize[index],gl.UNSIGNED_SHORT,0); // render
} // end render triangles



function clearCache(){

        globals.array4buffers.coordArray = [];
        globals.array4buffers.indexArray = [];
        globals.array4buffers.normalArray = [];
      
        resetMolelMatrices(shapeIndex);
        pMatrix[shapeIndex] = mat4.create();
        mat4.perspective(pMatrix[shapeIndex],Math.PI/2,1,0.1,1000);

}


function setUniformMatricesAll(){
   
   for(var index = 0 ; index < shapeIndex ; index++){
      setUniformMatrices(index)
}
}

function setUniformMatrices(index){
   
    gl.uniformMatrix4fv(model_matrix_uniform,false,mvMatrix[index]);
    console.log("set uniforms perspective : "+pMatrix[index])
    gl.uniformMatrix4fv(perspective_matrix_uniform,false,pMatrix[index]);

    gl.uniform4fv(vertexColorAttrib_a , shapeProperties[index].ambient);
    gl.uniform4fv(vertexColorAttrib_d , shapeProperties[index].diffuse);
    gl.uniform4fv(vertexColorAttrib_s , shapeProperties[index].specular);
    gl.uniform1f(specularIndex, shapeProperties[index].n);

}

function sq(x)
{return (x)*(x);}









function settingUpEvents(keyCode){
   var charPressed = String.fromCharCode(keyCode);
   console.log(keyCode +" "+ charPressed)

   /*Highlighting Part Keys 4 6(triangles) 8 9 (ellipsoids) */
   if(charPressed == '4' || charPressed == '6'){
        resetModelMatricesAll();
        
        if(charPressed == '6')
        highlightTriangleIndex = (highlightTriangleIndex + 1) %triangleIndices.length;
        else
        {
           highlightTriangleIndex =  (highlightTriangleIndex == 0) ? triangleIndices.length -1 : highlightTriangleIndex -1;
        }
        var index = triangleIndices[highlightTriangleIndex];
        currentHighlightedObject = index;
        setHighlightMatrix(index);

       

   }
    if(charPressed == '8' || charPressed == '2'){
        resetModelMatricesAll();
      
         if(charPressed == '8')
        highlightEllipsoidIndex = (highlightEllipsoidIndex + 1)%ellipsoidIndices.length;
        else
        {
           highlightEllipsoidIndex =  (highlightEllipsoidIndex == 0) ? ellipsoidIndices.length -1 : highlightEllipsoidIndex -1;
        }

        var index = ellipsoidIndices[highlightEllipsoidIndex];
        currentHighlightedObject = index;
        setHighlightMatrix(index);

       
   }

   if(charPressed == ' ')
   {
     resetModelMatricesAll();
    
   }

  
   renderAll();

}

function resetMolelMatrices(index)
{
    mvMatrix[index] = mat4.create();
    mat4.lookAt(mvMatrix[index],eyePos,lookAtVals,lookUpVals);
}

function resetModelMatricesAll()
{
    for(var index=0;index < noOfShapes ; index++)
    {
        resetMolelMatrices(index);
    }
}



function setHighlightMatrix(index){
    console.log("highlight mv : ",mvMatrix[index])
    var s = shapeProperties[index];

    console.log("shape property : "+s.center)
    mat4.translate(mvMatrix[index],mvMatrix[index], vec3.fromValues(s.center[0],s.center[1],s.center[2])  )
    mat4.scale(mvMatrix[index],mvMatrix[index],vec3.fromValues(1.2,1.2,1.2));
    mat4.translate(mvMatrix[index],mvMatrix[index], vec3.fromValues(-s.center[0],-s.center[1],-s.center[2])  )

}



$(function(){

$(window).keypress(function (e) {
    //use e.which
    var keyCode = e.which;
    settingUpEvents(keyCode);



});


    
});


function renderAll(){
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
    gl.clearDepth(1.0); // use max when we clear the depth buffer
    gl.enable(gl.DEPTH_TEST); // use black when we clear the frame buffer

for(var i=0; i<noOfShapes ; i++)
{
    renderShape(i);
}

}

/* MAIN -- HERE is where execution begins after window load */

function main() {
  
  setupWebGL(); // set up the webGL environment
 // loadTriangles(); // load in the triangles from tri file
  setupShaders();
  loadShapes("");
  // setup the webGL shaders
} // end main
