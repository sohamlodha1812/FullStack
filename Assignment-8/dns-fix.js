
const dns = require("dns");

const resolver = new dns.Resolver();
resolver.setServers(["8.8.8.8", "8.8.4.4"]);

dns.promises.resolveSrv = resolver.resolveSrv.bind(resolver);
dns.resolveSrv = resolver.resolveSrv.bind(resolver);
