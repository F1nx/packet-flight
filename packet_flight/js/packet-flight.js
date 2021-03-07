var FRAME_SIZE = 1000,
    NODE_RADIUS = 20,
    timeline = {};

var draw_packet_key = function (max_x, max_y) {
  var start_y = 10;
  var segments = Object.keys(PACKET_TYPES).length,
    segment_width = (max_y - start_y) / segments;

  var index = 0,
    packet_radius = 4;

  $.each(PACKET_TYPES, function (i, p) {
    index += 1;
    var y = start_y + (index * (segment_width + packet_radius)),
      x = 2 * packet_radius + NODE_RADIUS;
    var packet = PAPER.circle(x, y, packet_radius);
    var text = PAPER.text(x, y - (2 * packet_radius) - 5, i);

    packet.attr("fill", new p().fill);
  });
};

timeline.init = function (min, max) {
  this.start = min;
  this.end = max;
}

timeline.draw = function (packets, end_x, end_y, segments) {

  end_y += 75;
  end_x += 50;
  start_x = 50;
  var segment_width = 5,
    segment_distance = ((end_x - start_x) - (segments * segment_width)) / segments,
    segment_delay = packets[packets.length - 1].delay / segments;

  var start_delay,
    end_delay;

  PAPER.setStart();
  var j = 0;
  for (var i = 0; i < segments; i++) {
    var count = 0;
    for (; packets[j].delay < segment_delay * i; j += 1) {
      packets[j].fired = false;
      count += 1;
    }

    var segment = PAPER.rect(start_x, end_y, segment_width, count);
    segment.attr("fill", "rgba(1, 1, 0, 0.5)");
    start_x += segment_distance + segment_width;
  }

  var mover = PAPER.rect(50, end_y - 25, 5, 50);
  mover.attr("fill", "rgba(201,200,200,0.5)");
  var st = PAPER.setFinish();
  mover.animate({
    x: end_x,
  }, (this.end - this.start) * 1000 * PLAY_SPEED, function () {
    STOP_ANIMATION = true;
    PAPER = null;
  });
}

var DataPacket = function () {
  this.fill = "#1689cf";
  return this;
};

DataPacket.prototype.init = function (packet) {
  this.packet = packet;
  var size = Math.log(packet.bytes / 2 || 10);
  this.packetEl = PAPER.circle(packet.sendr.x, packet.sendr.y, size);
  this.packetEl.cleanup = $.proxy(function () {
    var s = this.packet.sendr,
      r = this.packet.recvr;
    for (var i in [s, r]) {
      var n = [s, r][i];
      packet_counter[n.name] -= 1;
      if (packet_counter[n.name] <= 0) {
        n.nodeEl.hide();
      }
    }
    this.packetEl.remove();

  }, this);
  this.packetEl.hide();
}

DataPacket.prototype.animate = function () {
  this.packetEl.attr("fill", this.fill || "#1689cf");
  this.packetEl.attr("stroke", "none");
  this.packetEl.show();
  var rand_num = function () {
    var n = parseInt(Math.random() * NODE_RADIUS / 2);
    if (Math.random() > 0.5) {
      n *= -1;
    }
    return n;
  };

  var control_x = this.packet.sendr.x + rand_num(),
    control_y = this.packet.sendr.y + rand_num();
  this.packetEl.attr("cx", control_x);
  this.packetEl.attr("cy", control_y);
  this.packetEl.animate({
    cx: this.packet.recvr.x + rand_num(),
    cy: this.packet.recvr.y + rand_num()
  },
    this.packet.flight_time * 1000 * PLAY_SPEED,
    "<>",
    $.proxy(function () { setTimeout(this.packetEl.cleanup, 500); }, this)
  );
}

function SynPacket() {
  this.fill = "#4d8c2a";
}
$.extend(SynPacket, DataPacket);

function FinPacket() {
  this.fill = "#990000";
}
$.extend(FinPacket, DataPacket);

function CtrlPacket() {
  this.fill = "#dddd00";
}
$.extend(CtrlPacket, DataPacket);

function UDPPacket() {
  this.fill = "#ec9234";
};

function PushPacket() {
};

function ReTransPacket() {
  this.fill = "#a7466c";
};

$.extend(SynPacket.prototype, DataPacket.prototype);
$.extend(FinPacket.prototype, DataPacket.prototype);
$.extend(CtrlPacket.prototype, DataPacket.prototype);
$.extend(UDPPacket.prototype, DataPacket.prototype);
$.extend(PushPacket.prototype, DataPacket.prototype);
$.extend(ReTransPacket.prototype, DataPacket.prototype);


var PACKET_TYPES = {
  "DATA": DataPacket,
  "SYN": SynPacket,
  "FIN": FinPacket,
  "CTRL": CtrlPacket,
  "UDP": UDPPacket,
  "PUSH": PushPacket,
  "RETRANS": ReTransPacket
}

for (var p in PACKET_TYPES) {
  if (!PACKET_TYPES.hasOwnProperty(p)) { continue; }
  window[p] = PACKET_TYPES[p];
}

var packets = [],
  packetEls = [],
  nodes = [];

nodes.put = nodes.push

function NetworkNode(name, x, y) {
  // private members
  this.name = name || "client";
  this.x = x;
  this.y = y;

  var sendPacket = function (node, delay, bytes, type, t) {
    var packet = new Packet(this, node, delay, bytes, type, t),
      packetEl = new packet.type();
    packets.push(packet);
    packet.packetEl = packetEl;
  };

  this.add = sendPacket;
};

function Packet(sendr, recvr, delay, bytes, type, flight_time) {
  this.sendr = sendr;
  this.recvr = recvr;
  this.delay = delay;
  this.bytes = bytes;
  this.flight_time = flight_time;
  this.type = type;
}

function blankTheCanvas(paper) {
  paper.setStart();
  paper.circle(16, 16, 15).attr({ fill: 'white' }).data('bound', true);
  paper.circle(16, 16, 10);
  // paper.path = Clock Icon
  paper.path('M16,6L16,9M21,7L19.5,10M25,11L22,12.5M26,16L23,16M25,21L22,19.5M21,25L19.5,22M16,26L16,23M11,25L12.5,22M7,21L10,19.5M6,16L9,16M7,11L10,12.5M11,7L12.5,10M18,9L16,16L20,16');
  paper.text(205, 16, 'Select Speed and then click on Visualize Packets to start animation...').attr({ 'font-size': 11 }).data('id', 'text_name');
  return paper.setFinish();
}

function start_animation(paper, play_speed) {
  var node,
    packet,
    max_x = 0,
    min_x = 10000,
    max_y = 0,
    min_y = 10000;

  STOP_ANIMATION = false;
  PAPER = paper;
  PLAY_SPEED = Math.abs(play_speed - 10) || 1;
  // 1 = Max Speed. 10 = Range Max. Math.abs() for flipping the value to correct
  packet_counter = {};

  start_time = new Date();
  packets.sort(function (a, b) {
    if (a.delay > b.delay) { return 1 }
    if (a.delay < b.delay) { return -1 }
    return 0;
  });

  for (var p = 0; p < packets.length; p++) {
    var packet = packets[p];
    packet.packetEl.init(packet);
  }

  for (var n in nodes) {
    var node = nodes[n];
    var nodeEl = PAPER.set();
    var node_circ = PAPER.circle(node.x, node.y, NODE_RADIUS);
    node_circ.attr("stroke", "none");


    nodeEl.push(node_circ);
    nodeEl.push(PAPER.text(node.x, node.y - NODE_RADIUS - 10, node.name));
    nodeEl.push(node_circ.glow({ width: 3 }));
    node.nodeEl = nodeEl;

    node_circ.hide();

    if (node.x) {
      min_x = Math.min(node.x, min_x);
      max_x = Math.max(node.x, max_x);
    }

    if (node.y) {
      min_y = Math.min(node.y, min_y);
      max_y = Math.max(node.y, max_y);
    }
    nodeEl.hide();
  }

  // Draw the little timeline bar across the top of the view
  var frame_skew = FRAME_SIZE / 1000 * PLAY_SPEED;
  timeline.draw(packets, max_x, max_y, 50);

  draw_packet_key(max_x, max_y);


  show_flight(PAPER, max_x, max_y);
}

fired = {};
function show_flight(PAPER, max_x, max_y) {

  var p = 0;
  var replay = function () {
    if (STOP_ANIMATION) { // saving CPUs
      return;
    }
    var packet = packets[p];
    var cur_time = new Date();

    var frame = (cur_time - start_time) / FRAME_SIZE / PLAY_SPEED;

    if (!packet) { setTimeout(replay, 200); return }
    var replay_time = (packet.delay - frame) * (FRAME_SIZE / 10 * PLAY_SPEED);


    if (replay_time <= 0 && !packet.fired) {
      packet.fired = true;
      packetEl = packet.packetEl;
      var s = packet.sendr,
        r = packet.recvr;

      if (!packet_counter[s.name]) { packet_counter[s.name] = 0 };
      if (!packet_counter[r.name]) { packet_counter[r.name] = 0 };

      for (var i in [s, r]) {
        var n = [s, r][i];
        packet_counter[n.name] += 1;
        n.nodeEl.stop().show();
        n.nodeEl.attr('fill-opacity', 1);
      }

      packetEl.animate(packet);

      p += 1;
      replay();
    } else {
      setTimeout(replay, Math.max(replay_time, 30));
    }
  };

  replay();
};
