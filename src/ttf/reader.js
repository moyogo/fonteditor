/**
 * @file reader.js
 * @author mengke01
 * @date 
 * @description
 * ttf读取器
 * 
 * thanks to：
 * ynakajima/ttf.js
 * https://github.com/ynakajima/ttf.js
 */

define(
    function(require) {

        var extend = require('common/lang').extend;
        var curry = require('common/lang').curry;

        // 检查数组支持情况
        if(typeof ArrayBuffer === 'undefined' || typeof DataView === 'undefined') {
            throw 'not support ArrayBuffer and DataView';
        }

        // 数据类型
        var dataType = {
            'Int8': 1,
            'Int16': 2,
            'Int32': 4,
            'Uint8': 1,
            'Uint16': 2,
            'Uint32': 4,
            'Float32': 4,
            'Float64': 8
        };


        var proto = {};

        /**
         * 读取指定的数据类型
         * 
         * @param {number} size 大小
         * @param {number=} offset 位移
         * @param {boolean=} littleEndian 是否小尾
         * @return {number} 返回值
         */
        function read(type, offset, littleEndian) {
            var size = dataType[type];
            // 使用当前位移
            if(undefined == offset) {
                offset = this.offset;
            }

            // 使用小尾
            if(undefined == littleEndian) {
                littleEndian = this.littleEndian;
            }
            this.offset = offset + size;

            return this.view['get' + type](offset, littleEndian);
        }

        // 直接支持的数据类型
        Object.keys(dataType).forEach(function(type) {
            proto['read' + type] = curry(read, type);
         });


        /**
         * 读取器
         * 
         * @constructor
         * @param {Array.<byte>} buffer 缓冲数组
         * @param {number} offset 起始偏移
         * @param {number} length 数组长度
         * @param {boolean} bigEndian 是否大尾
         */
        function Reader(buffer, offset, length, littleEndian) {

            var bufferLength = buffer.byteLength || buffer.length;

            this.offset = offset || 0;
            this.length = length || (bufferLength - this.offset);
            this.littleEndian = littleEndian || false;

            this.view = new DataView(buffer, this.offset, this.length);
        }

        Reader.prototype = {
            read: read,

            /**
             * 读取一个string
             * 
             * @param {number} offset 偏移
             * @param {number} length 长度
             * @return {string} 字符串
             */
            readString: function(offset, length) {

                if(arguments.length == 1) {
                    length = arguments[0];
                    offset = this.offset;
                }

                if(length < 0 || offset + length > this.length) {
                    throw 'length out of range:' + offset + ',' + length;
                }

                var value = '';
                for (var i = 0; i < length; ++i) {
                    var c = this.readUint8(offset + i);
                    value += String.fromCharCode(c > 127 ? 65533 : c);
                }

                this.offset = offset + length;

                return value;
            },

            /**
             * 读取一个字符
             * 
             * @param {number} offset 偏移
             * @return {string} 字符串
             */
            readChar: function(offset) {
                return this.readString(offset, 1);
            },

            /**
             * 读取fixed类型
             * 
             * @param {number} offset 偏移
             * @return {number} float
             */
            readFixed: function(offset) {
                if(undefined == offset) {
                    offset = this.offset;
                }
                var val = this.readInt32(offset, false) / 65536.0;
                return Math.ceil(val * 100000) / 100000;
            },

            /**
             * 读取长日期
             * 
             * @param {number} offset 偏移
             * @return {Date} Date对象
             */
            readLongDateTime: function(offset) {
                if(undefined == offset) {
                    offset = this.offset;
                }
                var delta = -2080198800000;// (new Date(1904, 1, 1)).getTime();
                var date = new Date();
                date.setTime(this.readUint32(offset + 4, false));
                return date;
            },

            /**
             * 跳转到指定偏移
             * 
             * @param {number} offset 偏移
             * @return {Object} this
             */
            seek: function (offset) {
                if (undefined == offset) {
                    this.offset = 0;
                }

                if (offset < 0 || offset > this.length) {
                    throw 'offset out of range:' + offset;
                }

                this.offset = offset;

                return this;
            },

            /**
             * 获取指定的字节数组
             * 
             * @return {Array} 字节数组
             */
            readBytes: function(offset, length) {

                if(arguments.length == 1) {
                    length = arguments[0];
                    offset = this.offset;
                }

                if(length < 0 || offset + length > this.length) {
                    throw 'length out of range:' + offset + ',' + length;
                }

                var buffer = [];
                for (var i = 0; i < length; ++i) {
                    buffer.push(this.view.getUint8(offset + i));
                }

                this.offset = offset + length;
                return buffer;
            }

        };

        extend(Reader.prototype, proto);

        return Reader;
    }
);
