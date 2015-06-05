# ScrapeAlibabaContact
 Scrape Alibaba Supplier contact

### Workflow
>1. request alibaba category and add category to redis.
>2. get category from redis, request list, insert brief info about company to the postgres.
>3. get brief info from postgres, add url to redis.
>4. request company contact, write data to postgres.


----
#### run postgres docker
```bash
docker run -p 5432:5432 --restart=always --name alibaba -e POSTGRES_PASSWORD=123456 -d postgres:9.3
```

#### create table
```sql
create table alibaba_company
(
id BIGSERIAL PRIMARY KEY,
name character varying(255),
sid bigint,
url character varying(255),
status character varying(255),  /* brief, detail, detailErr */
gold_supplier bigint,
assurance boolean,
contact json,
update_date timestamp
)
```

#### run redis server
```bash
redis-server &
```

#### get category insert to redis
```bash
node getCategory.js
```

#### write company brief to local database
```bash
node getCompanyBrief.js
```

#### insert company brief from database to redis
```bash
node prepareCOmpanyDetailEnv.js
```

#### update company detail to local database
```bash
node getCompanyDetail.js
```

----
#### query table
```sql
select * from alibaba_company;
select count(*) from alibaba_company;
select * from alibaba_company order by id desc limit 50 ;
SELECT sid, count(*) as count FROM alibaba_company group by sid order by count desc;
SELECT count(*),name FROM alibaba_company group by name order by count(*) desc;
SELECT * FROM alibaba_company WHERE name LIKE '%Chengli Special%'; /* same company name with different sid, url*/
```

#### query redis
```bash
SCARD alibaba_category_key
SCARD alibaba_company_key
SRANDMEMBER alibaba_category_key 5
SRANDMEMBER alibaba_company_key 5
```

#### format for export
```sql
select id, name, url, contact->>'person' as Person,contact->>'Department' as Department,contact->>'Job Title' as Job_Title,contact->>'Telephone' as Telephone,contact->>'Mobile Phone' as Mobile_Phone,contact->>'Fax' as Fax,contact->>'Address' as Address,contact->>'Country/Region' as Country_Region,contact->>'Province/State' as Province_State, contact->>'City' as City,contact->>'Province/State' as Province_State,contact->>'Zip' as Zip from alibaba_company where status = 'detail' and contact->>'person' <> '' ;
```
