import Taro from '@tarojs/taro';
import { View, Image, Text } from '@tarojs/components';
import * as styles from './index.module.scss';

const mockProps = {
  failImg:
    "'http://idlefish-autoui.oss-cn-hangzhou.aliyuncs.com/aliyun_k8s%2Fai_image%2F8cd2ee4b9e45995650fe0226fff645be.png'",
  title: '湖南省州市万华汽车南站09:20',
  title_2: '湖南省郴州市万华汽车南站北巷路485号',
  failureImg:
    "'http://idlefish-autoui.oss-cn-hangzhou.aliyuncs.com/aliyun_k8s%2Fai_image%2F4ea200ca6aad630521377118474e0891.png'",
  title_3: '郴州万华汽车站(高铁站)约1:50',
  row: '郴州高铁西站旁',
  title_4: '用车须知、退改说明',
  PagingRightImg:
    "'http://idlefish-autoui.oss-cn-hangzhou.aliyuncs.com/aliyun_k8s%2Fai_image%2F7a0aec1949cb5cb4d2d0428fc12f5e8a.png'"
};

const Mod = (props = mockProps) => {
  return (
    <View style={styles.box}>
      <View style={styles.bd}>
        <Image style={styles.fail} src={props.failImg} />
        <Text style={styles.title}>{props.title}</Text>
      </View>
      <View style={styles.main}>
        <Text style={styles.title_2}>{props.title_2}</Text>
      </View>
      <View style={styles.submain}>
        <Image style={styles.failure} src={props.failureImg} />
        <Text style={styles.title_3}>{props.title_3}</Text>
      </View>
      <Text style={styles.row}>{props.row}</Text>
      <View style={styles.row_2}>
        <View style={styles.color} />
      </View>
      <View style={styles.ft}>
        <Text style={styles.title_4}>{props.title_4}</Text>
        <Image style={styles.PagingRight} src={props.PagingRightImg} />
      </View>
    </View>
  );
};

export default Mod;
