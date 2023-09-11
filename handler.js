'use strict';
const querystring = require('querystring');
const mysql = require('mysql');
const AWS = require('aws-sdk');

const s3 = new AWS.S3();
const sqs = new AWS.SQS();
const ses = new AWS.SES({ region: 'us-east-1' });

const conexion = mysql.createConnection({
  host: 'aws-proyectofinal-cb-dev-rdsdatabase-iibxlx1nmpww.c9jwd0itecy9.us-east-1.rds.amazonaws.com',
  user: 'admin',
  port: '3306',
  password: 'db2023cb',
  database: 'restaurante_cb',
});

// Utilidad para ejecutar consultas SQL de forma asincrónica
const queryAsync = (query, params) => {
  return new Promise((resolve, reject) => {
    conexion.query(query, params, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Función para crear un pedido
module.exports.crearPedido = async (event) => {
  try {
    const pedido = querystring.parse(event["body"]);

    // Insertar el pedido en la base de datos
    await queryAsync("CALL InsertarPedido(?, ?, ?, ?);", [pedido.cliente_id, pedido.producto_id, pedido.cantidad, pedido.valor_total]);

    // Obtener información del cliente
    const [clienteInfo] = await queryAsync("SELECT nombre_completo, correo_electronico FROM clientes WHERE id = ?;", [pedido.cliente_id]);
    const clienteNombre = clienteInfo.nombre_completo;
    const clienteEmail = clienteInfo.correo_electronico;

    // Obtener información del producto
    const [productoInfo] = await queryAsync("SELECT nombre_producto, valor_producto FROM productos WHERE id = ?;", [pedido.producto_id]);
    const producto_nombre = productoInfo.nombre_producto;
    const producto_valor = productoInfo.valor_producto;

    // Crear un nombre de archivo único para el pedido
    const timestamp = new Date().getTime();
    const filename = `pedido_${timestamp}.json`;

    // Crear un objeto con los datos del pedido
    const pedidoData = {
      Cliente: clienteNombre,
      Producto: producto_nombre,
      Cantidad: pedido.cantidad,
      "Valor Total": pedido.valor_total,
    };

    // Almacenar los datos del pedido en Amazon S3
    await s3.putObject({
      Bucket: 'buket-respaldo-cb',
      Key: filename,
      Body: JSON.stringify(pedidoData),
    }).promise();

    // Enviar el pedido a una cola SQS
    const params = {
      MessageBody: JSON.stringify(pedidoData),
      QueueUrl: 'https://sqs.us-east-1.amazonaws.com/667168568942/cola-cb',
    };
    await sqs.sendMessage(params).promise();

    // Enviar correo electrónico al cliente
    const paramsEmail = {
      Source: "brandon.carvajal27520@ucaldas.edu.co",
      Destination: {
        ToAddresses: [clienteEmail],
      },
      Message: {
        Subject: {
          Data: "Detalles del pedido",
        },
        Body: {
          Text: {
            Data: `Detalles del pedido:\n\nCliente: ${clienteNombre}\nProducto: ${producto_nombre}\nValor unitario: ${producto_valor}\nCantidad: ${pedido.cantidad}\nValor Total: ${pedido.valor_total}`,
          },
        },
      },
    };
    await ses.sendEmail(paramsEmail).promise();

    // Devolver una respuesta exitosa
    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: "Pedido creado con éxito",
          Cliente: clienteNombre,
          Producto: producto_nombre,
          Cantidad: pedido.cantidad,
          "Valor Total": pedido.valor_total,
        },
        null,
        2
      ),
    };
  } catch (error) {
    // Manejar errores
    return {
      statusCode: 500,
      body: JSON.stringify(
        {
          error: "Error al procesar el pedido",
        },
        null,
        2
      ),
    };
  }
};

// Función para obtener un pedido por ID
module.exports.obtenerPedido = async (event) => {
  try {
    const pedidoId = event.queryStringParameters.id;
    const queryPedido = "SELECT p.*, c.nombre_completo AS cliente, c.telefono, c.correo_electronico, pr.nombre_producto AS producto, pr.valor_producto FROM restaurante_cb.pedidos p " +
                      "INNER JOIN clientes c ON p.cliente_id = c.id " +
                      "INNER JOIN productos pr ON p.producto_id = pr.id " +
                      "WHERE p.id = ?;";
    const [pedido] = await queryAsync(queryPedido, [pedidoId]);

    if (!pedido) {
      return {
        statusCode: 404,
        body: JSON.stringify(
          {
            error: "Pedido no encontrado",
          },
          null,
          2
        ),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          cliente: pedido.cliente,
          telefono: pedido.telefono,
          email: pedido.correo_electronico,
          producto: pedido.producto,
          "valor producto": pedido.valor_producto,
          cantidad: pedido.cantidad,
          "valor total": pedido.valor_total,
        },
        null,
        2
      ),
    };
  } catch (error) {
    // Manejar errores
    return {
      statusCode: 500,
      body: JSON.stringify(
        {
          error: "Error al obtener el pedido",
        },
        null,
        2
      ),
    };
  }
};