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

module.exports.crearPedido = async (event) => {
  const pedido = querystring.parse(event["body"])
  const queryclient = "CALL InsertarPedido(?, ?, ?, ?);";
  await new Promise((resolve, reject) => {
    conexion.query(queryclient, [pedido.cliente_id, pedido.producto_id, pedido.cantidad, pedido.valor_total], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
  // Consultar la base de datos para obtener el correo electrónico del cliente
  const queryClienteEmail = "SELECT nombre_completo, correo_electronico FROM clientes WHERE id = ?;";
  let clienteNombre = '';
  let clienteEmail = '';
  
  await new Promise((resolve, reject) => {
    conexion.query(queryClienteEmail, [pedido.cliente_id], (err, results) => {
      if (err) {
        reject(err);
      } else {
        if (results && results.length > 0) {
          clienteNombre = results[0].nombre_completo;
          clienteEmail = results[0].correo_electronico;
        }
        resolve();
      }
    });
  });

  // Consultar la base de datos para obtener el nombre y valor del producto
  const queryProducto = "SELECT nombre_producto, valor_producto FROM productos WHERE id = ?;";
  let producto_nombre = '';
  let producto_valor = 0;

  await new Promise((resolve, reject) => {
    conexion.query(queryProducto, [pedido.producto_id], (err, results) => {
      if (err) {
        reject(err);
      } else {
        if (results && results.length > 0) {
          producto_nombre = results[0].nombre_producto;
          producto_valor = results[0].valor_producto;
        }
        resolve();
      }
    });
  });
  
  const timestamp = new Date().getTime();
  const filename = `pedido_${timestamp}.json`;

  const pedidoData = {
    Cliente: clienteNombre,
    Producto: producto_nombre,
    Cantidad: pedido.cantidad,
    "Valor Total": pedido.valor_total,
  };

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

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Pedido creado con exito",
        Cliente: clienteNombre,
        Producto: producto_nombre,
        Cantidad: pedido.cantidad,
        "Valor Total": pedido.valor_total,
      },
      null,
      2
    ),
  };
};

module.exports.obtenerPedido = async (event) => {
  const pedidoId = event.queryStringParameters.id;
  const queryPedido = "SELECT * FROM restaurante_cb.pedidos WHERE id = ?";
  const results = await new Promise((resolve, reject) => {
    conexion.query(queryPedido, [pedidoId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        pedido: results[0],
      },
      null,
      2
    ),
  };
};