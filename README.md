# aws_proyecto_final

Este es un proyecto Serverless que utiliza AWS Lambda y API Gateway para crear y obtener pedidos en un restaurante. Los pedidos se almacenan en un bucket de Amazon S3 como respaldo.

Configuración:

Archivo serverless.yml
El archivo serverless.yml contiene la configuración principal del servicio Serverless. Aquí se definen las funciones, los recursos y otros detalles importantes. A continuación, se describen algunos aspectos clave de este archivo:

service: El nombre de tu servicio, en este caso, "aws-proyectofinal-cb".
frameworkVersion: La versión del framework Serverless que estás utilizando, que es "3" en este caso.
provider: La configuración del proveedor AWS, incluyendo la región y el entorno de ejecución.
plugins: Los plugins adicionales que se utilizan en este proyecto, como "serverless-iam-roles-per-function".
functions: Las definiciones de las funciones Lambda, incluyendo los manejadores y los eventos que desencadenan estas funciones.
resources: Las definiciones de recursos de CloudFormation, en este caso, un bucket de S3 llamado "buket-respaldo-cb".

Archivo handler.js
El archivo handler.js contiene la lógica de tus funciones Lambda. En este proyecto, se implementan dos funciones:

crearPedido: Esta función se dispara cuando se realiza una solicitud HTTP POST a "/crearPedido". Guarda el pedido en una base de datos MySQL y lo respalda en un bucket de S3.
obtenerPedido: Esta función se dispara cuando se realiza una solicitud HTTP GET a "/obtenerPedido". Recupera un pedido de la base de datos según su ID.

Requisitos:

Antes de desplegar este proyecto, asegúrate de tener lo siguiente configurado:

Una cuenta de AWS con las credenciales adecuadas.
Node.js y el Framework Serverless instalados en tu entorno de desarrollo.
Una base de datos MySQL configurada y accesible desde tu función Lambda.
Un bucket de S3 creado para respaldar los pedidos.

Despliegue:

Para desplegar este proyecto, sigue estos pasos:

Clona este repositorio a tu máquina local.

Instala las dependencias Node.js ejecutando npm install.

Configura tus credenciales de AWS utilizando aws configure.

instala los modulos necesarios para el correcto funcionamiento

npm install --save querystring

npm install mysql

npm install aws-sdk --save

npm install --save serverless-iam-roles-per-function

¡NO TE OLVIDES DE CAMBIAR LAS CONEXION PARA TU BASE DE DATOS Y CAMBIAR LO VALORES SEGUN TUS TABLAS!

Ejecuta el comando serverless deploy para desplegar el proyecto en tu cuenta de AWS.

Uso:
Una vez que el proyecto esté desplegado, puedes utilizar las siguientes rutas:

POST /crearPedido: Para crear un nuevo pedido en el restaurante.
GET /obtenerPedido?id=<pedido_id>: Para obtener un pedido específico por su ID.
