'use strict';
const querystring = require('querystring');
const mysql = require('mysql');
const AWS = require('aws-sdk');

const s3 = new AWS.S3();
const sqs = new AWS.SQS();

const conexion = mysql.createConnection({
  host: 'aws-proyectodfinal-cb.c9jwd0itecy9.us-east-1.rds.amazonaws.com',
  user: 'admin',
  port: '3306',
  password: '12345678',
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
  
  const timestamp = new Date().getTime();
  const filename = `pedido_${timestamp}.json`;

  const pedidoData = {
    Cliente: pedido.cliente_id,
    Producto: pedido.producto_id,
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

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Pedido creado con exito",
        Cliente: pedido.cliente_id,
        Producto: pedido.producto_id,
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