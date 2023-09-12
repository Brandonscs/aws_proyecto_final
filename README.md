# aws_proyecto_final

Este es un proyecto Serverless que utiliza AWS Lambda y API Gateway para crear y obtener pedidos en un restaurante.

## Requisitos:

Antes de desplegar este proyecto, asegúrate de tener lo siguiente configurado en tu entorno de desarrollo:

1. **Cuenta de AWS**: Debes tener una cuenta de AWS con las credenciales adecuadas. Puedes configurar tus credenciales de AWS ejecutando `aws configure`.

2. **Node.js y Serverless Framework**: Asegúrate de tener Node.js instalado en tu sistema. Luego, instala el Serverless Framework globalmente ejecutando el siguiente comando:

npm install -g serverless

3. **Módulos y Recursos**: Ejecuta los siguientes comandos para instalar los módulos y recursos necesarios para el proyecto:

- npm install --save querystring
- npm install mysql
- npm install aws-sdk --save
- npm install --save serverless-iam-roles-per-function

## Despliegue:

Para desplegar este proyecto, sigue estos pasos:

1. Clona este repositorio a tu máquina local.

2. Configura tus credenciales de AWS utilizando `aws configure`.

3. Ejecuta el siguiente comando para desplegar el proyecto en tu cuenta de AWS:

serverless deploy

## Uso:

Una vez que el proyecto esté desplegado, puedes utilizar las siguientes rutas:

- **POST /crearPedido**: Utiliza esta ruta para crear un nuevo pedido en el restaurante.

- **GET /obtenerPedido?id=<pedido_id>**: Utiliza esta ruta para obtener un pedido específico por su ID.

Cuando se realiza un pedido, se enviará a una cola, se guardará en un bucket de respaldo y se enviará un correo electrónico con los detalles del pedido.

**¡No olvides actualizar tus credenciales de base de datos en el archivo `handler.js`, tus credenciales para el envío del correo electrónico, y los nombres de tus colas SQS y buckets en tu configuración!**