class RouteReply {
  static send(res, reply) {
    if (reply.status === 204) return res.status(204).end();
    return res.status(reply.status || 200).json(reply.body);
  }
}

module.exports = RouteReply;
