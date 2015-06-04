# ScrapeAlibabaContact
 Scrape Alibaba Supplier contact
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
status character varying(255),
gold_supplier bigint,
assurance boolean,
contact json,
update_date timestamp
)
```

#### get category
```bash
node getCategory.js
```
#### get company detail to local database
```bash
node getCompanyList.js
```

#### query table
```sql
select * from alibaba_company;
select count(*) from alibaba_company;
select * from alibaba_company order by id desc limit 50 ;
SELECT sid, count(*) as count FROM alibaba_company group by sid order by count desc;
```

#### format for export
```sql
select id, name, url, contact->>'person' as person,contact->>'Department' as Department,contact->>'Job Title' as Job_Title,contact->>'Telephone' as Telephone,contact->>'Mobile Phone' as Mobile_Phone,contact->>'Fax' as Fax,contact->>'Address' as Address,contact->>'Country/Region' as Country_Region,contact->>'Province/State' as Province_State, contact->>'City' as City,contact->>'Province/State' as Province_State,contact->>'Zip' as Zip from alibaba_company limit 50;
```
