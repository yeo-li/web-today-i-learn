# DB 실습 답안

## 전제

- 이 문서는 `attendance` 테이블에서 `nickname`을 분리해 `crew` 테이블로 정규화하는 흐름을 기준으로 작성했다.
- 제공된 seed 데이터에는 `어셔`, `주니`, `아론`이 없다. 따라서 문제 6~9는 해당 크루가 이미 `crew` 테이블에 존재한다고 가정하고 작성했다.
- 문제 13~16의 결과 표는 제공된 seed 데이터 기준이다.

## 1. DDL 실습

### 문제 1

1. `attendance` 테이블은 중복된 데이터가 쌓이는 구조이다. 중복된 데이터는 어떤 컬럼인가?

`nickname`

2. `attendance` 테이블에서 중복을 제거하기 위해 `crew` 테이블을 만들려고 한다. 어떻게 구성해 볼 수 있을까?

`crew_id`와 `nickname`을 컬럼으로 가지고, `crew_id`가 PK인 테이블로 만든다.

3. `crew` 테이블에 들어가야 할 크루들의 정보는 어떻게 추출할까? (`DISTINCT`)

```sql
SELECT DISTINCT crew_id, nickname
FROM attendance;
```

4. 최종적으로 `crew` 테이블 생성

```sql
CREATE TABLE crew (
  crew_id INT NOT NULL AUTO_INCREMENT,
  nickname VARCHAR(50) NOT NULL,
  PRIMARY KEY (crew_id)
);
```

5. `attendance` 테이블에서 크루 정보를 추출해서 `crew` 테이블에 삽입하기

```sql
INSERT INTO crew (crew_id, nickname)
SELECT DISTINCT crew_id, nickname
FROM attendance;
```

### 문제 2: 테이블 컬럼 삭제하기 (ALTER TABLE)

1. `crew` 테이블을 만들고 중복을 제거했다. `attendance`에서 불필요해지는 컬럼은?

`nickname`

2. 컬럼을 삭제하려면 어떻게 해야 하는가?

```sql
ALTER TABLE attendance
DROP COLUMN nickname;
```

### 문제 3: 외래키 설정하기

`attendance`에서 관심사의 분리를 통해 `crew` 테이블을 별도로 만들었다. 따라서, 나중에 `nickname`이 필요하다면 `crew` 테이블에서 확인하면 된다.

그런데 잠재적인 문제가 남아 있다.

- 만약 `crew` 테이블에는 `crew_id`가 12번인 크루가 존재하지 않지만, `attendance` 테이블에는 여전히 `crew_id`가 12번인 크루가 존재한다면?
- 해당 크루가 중간에 퇴소했거나
- 누군가의 실수에 의해 레코드가 삭제되었거나

`attendance.crew_id`가 `crew.crew_id`를 참조하도록 설정한다.

```sql
ALTER TABLE attendance
ADD CONSTRAINT fk_attendance_crew
FOREIGN KEY (crew_id) REFERENCES crew(crew_id);
```

### 문제 4: 유니크 키 설정

우아한테크코스에서는 닉네임의 중복이 엄연히 금지된다. 그런데 현재 테이블에는 중복된 닉네임이 담길 수 있다. `crew` 테이블의 결함을 어떻게 해결할 수 있을까?

닉네임 중복 금지 조건을 `crew`에 추가한다.

```sql
ALTER TABLE crew
ADD CONSTRAINT uq_crew_nickname UNIQUE (nickname);
```

## 2. DML(CRUD) 실습

### 문제 5: 크루 닉네임 검색하기 (LIKE)

```sql
SELECT *
FROM crew
WHERE nickname LIKE '디%';
```

### 문제 6: 출석 기록 확인하기 (SELECT + WHERE)

성실의 아이콘 어셔는 등굣길에 스마트폰을 떨어뜨리는 바람에 3월 6일에 등교/하교 버튼을 누르지 못했다. 담당 코치에게 빠르게 공유한 그를 구제하기 위해 검프가 출석 처리를 해 주려고 한다.

어셔: 안녕하세요 검프. 저는 3월 6일 09시 31분에 등교하고 18시 01분에 하교했습니다. 감사합니다.  
검프: 네 ^^;;; (이거 어쩌나...)

일단, 정말로 어셔의 기록이 누락됐는지부터 확인해 보자.

```sql
SELECT a.*
FROM attendance a
JOIN crew c ON a.crew_id = c.crew_id
WHERE c.nickname = '어셔'
  AND a.attendance_date = '2025-03-06';
```

### 문제 7: 누락된 출석 기록 추가 (INSERT)

확인해 보니, 어셔는 그날 출석 체크를 하지 못한 것이 사실로 드러났다. 사후 처리를 위해 출석을 추가해야 하는데 어떻게 추가해야 할까?

```sql
INSERT INTO crew (crew_id, nickname)
VALUES (13, '어셔');

INSERT INTO attendance (crew_id, attendance_date, start_time, end_time)
VALUES (13, '2025-03-06', '09:31:00', '18:01:00');
```

### 문제 8: 잘못된 출석 기록 수정 (UPDATE)

주니는 3월 12일 10시 정각에 캠퍼스에 도착했지만, 등교 버튼을 누르는 것을 깜빡하고 데일리 미팅에 참여했다. 뒤늦게야 알게 됐는데 시각은 10시 5분이었다.

주니: 검프~! 제가 3월 12일 10시 정각에 캠퍼스에 도착했는데 깜빡하고 등교 버튼을 늦게 눌렀어요. 나중에 확인해 보니까 10시 5분이더라구욥ㅠ 👉🏻👈🏻 ... 죄송한데 한 번만 출석 처리 해주실 수 있을까욥??? 🥹🥹  
검프: 네 ^^;;; (그냥 지각 처리하면 안 되나ㅠㅠ)

```sql
UPDATE attendance a
JOIN crew c ON a.crew_id = c.crew_id
SET a.start_time = '10:00:00'
WHERE c.nickname = '주니'
  AND a.attendance_date = '2025-03-12';
```

### 문제 9: 허위 출석 기록 삭제 (DELETE)

시력은 좋지 않지만, 평소 눈썰미가 좋은 검프는 아론이 3월 12일에 캠퍼스에 도착하지 않은 점을 깨달았다. 그런데 무슨 이유에서인지 그날 출석 처리가 되어 있는 것을 우연히 발견했다.

검프: 아론...? 3월 12일에는 안 나오셨잖아요? 그날 구구한테 물어보니까 안 나오셨다던데...  
아론: 앗.. 죄송해요 ㅜㅜ  
검프: 해당 기록은 제가 지우겠습니다..

warning: 실습을 위해 연출된 상황이며, 실제로 허위 출석을 시도하는 경우 Honor Code 위반으로 즉시 퇴소 조치된다.

```sql
DELETE a
FROM attendance a
JOIN crew c ON a.crew_id = c.crew_id
WHERE c.nickname = '아론'
  AND a.attendance_date = '2025-03-12';
```

### 문제 10: 출석 정보 조회하기 (JOIN)

검프는 SQL이 익숙지 않아 `crew` 테이블에서 먼저 닉네임을 검색하고 해당 아이디 값을 찾아 직접 `WHERE`문에서 `crew_id` 항목의 값을 수동으로 입력해서 출석 기록을 조회했다. 그런데 `crew` 테이블에서 `crew_id`를 기준으로 `nickname` 필드 값을 가져와서 함께 조회할 수도 있지 않을까?

```sql
SELECT *
FROM attendance a
JOIN crew c ON a.crew_id = c.crew_id
WHERE c.nickname = '검프';
```

### 문제 11: nickname으로 쿼리 처리하기 (서브 쿼리)

검프는 SQL이 익숙지 않아 `crew` 테이블에서 먼저 닉네임을 검색하고 해당 아이디 값을 찾아 직접 `WHERE`문에서 `crew_id` 항목의 값을 수동으로 입력했다. 그런데 `nickname`을 입력하면 이를 기준으로 쿼리문을 처리할 수도 있지 않을까?

```sql
SELECT *
FROM attendance
WHERE crew_id = (
  SELECT crew_id
  FROM crew
  WHERE nickname = '검프'
);
```

### 문제 12: 가장 늦게 하교한 크루 찾기

3월 6일, 검프는 우연히 아침에 일찍 눈을 떴다. 상쾌하게 일찍 출근하기로 마음을 먹고 캠퍼스로 향했다. 검프가 가장 먼저 도착했다. 하지만, 경비 처리가 되어 있지 않은 걸 확인했다. 전날(3월 5일) 가장 늦게 하교한 크루를 찾아 DM을 보내려고 하는데 크루의 닉네임과 하교 시각은 어떻게 찾을 수 있을까?

```sql
SELECT c.nickname, a.end_time
FROM attendance a
JOIN crew c ON a.crew_id = c.crew_id
WHERE a.attendance_date = '2025-03-05'
  AND a.end_time = (
    SELECT MAX(end_time)
    FROM attendance
    WHERE attendance_date = '2025-03-05'
  );
```

## 3. 집계 함수 실습

### 문제 13: 크루별로 기록된 날짜 수 조회

```sql
SELECT crew_id, COUNT(*)
FROM attendance
GROUP BY crew_id;
```

### 문제 14: 크루별로 등교 기록이 있는(start_time IS NOT NULL) 날짜 수 조회

```sql
SELECT c.nickname, COUNT(*)
FROM attendance a
JOIN crew c ON a.crew_id = c.crew_id
WHERE a.start_time IS NOT NULL
GROUP BY c.crew_id, c.nickname;
```

### 문제 15: 날짜별로 등교한 크루 수 조회

```sql
SELECT attendance_date, COUNT(*)
FROM attendance
WHERE start_time IS NOT NULL
GROUP BY attendance_date;
```

### 문제 16: 크루별 가장 빠른 등교 시각(MIN)과 가장 늦은 등교 시각(MAX)

```sql
SELECT c.nickname, MIN(a.start_time), MAX(a.start_time)
FROM attendance a
JOIN crew c ON a.crew_id = c.crew_id
WHERE a.start_time IS NOT NULL
GROUP BY c.crew_id, c.nickname;
```